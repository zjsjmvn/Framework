import { AssetManager, AudioClip, AudioSource, Component, director, error, Node, resources } from 'cc';
import { resLoader } from '../../utils/res-loader';
import { AudioMusic } from './audio-music';
import { AudioEffect } from './audio-effect';

/** A restartable voice whose pending native AudioPlayer is owned by the manager. */
class EffectChannel {
    readonly source: AudioSource;
    latestName: string | null = null;
    private loading = false;
    private loaded = false;
    private paused = false;

    constructor(parent: Node, name: string, private readonly cached: (name: string) => AudioClip | null,
        private readonly allowed: () => boolean) {
        const node = new Node(`AudioEffectChannel_${name}`);
        node.parent = parent;
        this.source = node.addComponent(AudioSource);
        this.source.playOnAwake = false;
        this.source.loop = false;
        node.on('audiosource-loaded', this.onLoaded, this);
    }

    request(name: string, cached: boolean): void {
        this.latestName = name;
        if (!cached) this.stop(false);
    }

    play(name: string, clip: AudioClip): void {
        if (!this.allowed() || this.latestName !== name || !this.source.isValid) return;
        this.source.stop();
        this.paused = false;
        if (this.source.clip !== clip) {
            // A -> B -> A must not begin a second native load of A before the
            // first finishes. The completion below chooses the latest clip.
            if (this.loading) return;
            this.loaded = false;
            this.loading = true;
            this.source.clip = clip;
            return;
        }
        if (!this.loaded) return;
        this.source.currentTime = 0;
        this.source.play();
    }

    stop(cancelNative = true): void {
        if (!this.source.isValid) return;
        this.source.stop();
        this.paused = false;
        if (!cancelNative && this.loading) return;
        this.loading = false;
        this.loaded = false;
        this.source.clip = null;
        if (cancelNative) this.latestName = null;
    }

    pause(): void {
        this.paused = this.source.playing;
        if (this.paused) this.source.pause();
    }

    resume(): void {
        if (this.paused && this.allowed()) this.source.play();
        this.paused = false;
    }

    destroy(): void {
        this.stop();
        this.source.node.off('audiosource-loaded', this.onLoaded, this);
        if (this.source.node.isValid) this.source.node.destroy();
    }

    private onLoaded(): void {
        this.loading = false;
        this.loaded = true;
        if (!this.latestName || !this.allowed()) return;
        const clip = this.cached(this.latestName);
        if (clip) this.play(this.latestName, clip);
    }
}

/** Owner-scoped effects: cancelling one screen cannot silence another owner. */
export class AudioEffectSession {
    private readonly channels = new Map<string, EffectChannel>();
    private readonly pending = new Map<string, { generation: number; callback?: Function }>();
    private enabled = true;
    private disposed = false;
    private generation = 0;
    private volume = 1;

    constructor(private readonly manager: AudioManager, private readonly release: () => void) {}

    /** Omit channel for a one-shot; the same named channel always replaces its previous voice. */
    playEffect(name: string, channel?: string, callback?: Function): void {
        if (!name || !this.canPlay()) return;
        const clip = this.manager.getCachedClip(name);
        let voice: EffectChannel | undefined;
        if (channel) {
            voice = this.channels.get(channel);
            if (!voice) {
                voice = new EffectChannel(this.manager.node, channel,
                    key => this.manager.getCachedClip(key), () => this.canPlay());
                this.channels.set(channel, voice);
                voice.source.volume = this.volume * this.manager.effectVolume;
            }
            voice.request(name, !!clip);
        }
        const play = (asset: AudioClip, done?: Function): void => {
            if (voice) {
                if (voice.latestName === name) { voice.play(name, asset); done?.(); }
            } else this.manager.playSessionClip(asset, this.volume, done);
        };
        if (clip) { play(clip, callback); return; }
        const key = `${channel ?? ''}\0${name}`;
        const existing = this.pending.get(key);
        if (existing) {
            existing.generation = this.generation;
            existing.callback = callback;
            return;
        }
        const request = { generation: this.generation, callback };
        this.pending.set(key, request);
        this.manager.loadClip(name, (failure, asset) => {
            if (this.pending.get(key) !== request) return;
            this.pending.delete(key);
            if (failure || !asset || request.generation !== this.generation || !this.canPlay()) return;
            play(asset, request.callback);
        });
    }

    setEnabled(enabled: boolean): void {
        const next = enabled !== false;
        if (next === this.enabled || this.disposed) return;
        this.enabled = next;
        if (!next) this.cancel();
    }

    setVolume(value: number): void {
        this.volume = Math.max(0, Math.min(1, Number(value) || 0));
        this.refreshVolume();
    }

    /** Invalidates pending playback while leaving useful shared asset loads alive. */
    cancel(discardLoads = false): void {
        ++this.generation;
        if (discardLoads) this.pending.clear();
        for (const channel of this.channels.values()) channel.stop();
    }

    stopChannel(name: string): void {
        this.channels.get(name)?.stop();
    }

    refreshVolume(): void {
        for (const channel of this.channels.values()) channel.source.volume = this.volume * this.manager.effectVolume;
    }

    pause(): void { for (const channel of this.channels.values()) channel.pause(); }
    resume(): void { for (const channel of this.channels.values()) channel.resume(); }

    destroy(): void {
        if (this.disposed) return;
        this.disposed = true;
        this.cancel();
        this.pending.clear();
        for (const channel of this.channels.values()) channel.destroy();
        this.channels.clear();
        this.release();
    }

    private canPlay(): boolean { return !this.disposed && this.enabled && this.manager.audioEffectSwitchState; }
}

type ClipComplete = (failure: Error | null, clip: AudioClip | null) => void;

export class AudioManager extends Component {
    static _instance: AudioManager;

    static get instance(): AudioManager {
        if (!this._instance || !this._instance.isValid) {
            const node = new Node('AudioManager');
            director.addPersistRootNode(node);
            this._instance = node.addComponent(AudioManager);
            const music = new Node('AudioMusic');
            music.parent = node;
            this._instance.audioMusic = music.addComponent(AudioMusic);
            this._instance.audioMusic.playOnAwake = false;
            const effect = new Node('AudioEffect');
            effect.parent = node;
            this._instance.audioEffect = effect.addComponent(AudioEffect);
            this._instance.audioEffect.playOnAwake = false;
        }
        return this._instance;
    }

    private readonly clips = new Map<string, AudioClip>();
    private readonly loading = new Map<string, { callbacks: ClipComplete[]; generation: number }>();
    private readonly assetsByName = new Map<string, { path: string; bundle: string }>();
    private readonly sessions = new Set<AudioEffectSession>();
    private defaultSession: AudioEffectSession | null = null;
    private audioMusic!: AudioMusic;
    private audioEffect!: AudioEffect;
    private readonly loopEffects = new Map<string, AudioEffect>();
    private readonly requestedLoopEffects = new Set<string>();
    private readonly loopVersions = new Map<string, number>();
    private musicPlayRequestVersion = 0;
    private cacheGeneration = 0;
    private disposed = false;
    private releaseWhenUnused = false;
    private _musicVolume = 1;
    private _effectVolume = 1;
    private _audioMusicSwitchState = true;
    private _audioEffectSwitchState = true;

    get musicVolume(): number { return this._musicVolume; }
    set musicVolume(value: number) { this._musicVolume = value; this.audioMusic.volume = value; }
    get effectVolume(): number { return this._effectVolume; }
    set effectVolume(value: number) {
        this._effectVolume = value;
        this.audioEffect.volume = value;
        this.loopEffects.forEach(effect => { effect.volume = value; });
        this.sessions.forEach(session => session.refreshVolume());
    }
    get audioMusicSwitchState(): boolean { return this._audioMusicSwitchState; }
    set audioMusicSwitchState(value: boolean) {
        if (value === this._audioMusicSwitchState) return;
        this._audioMusicSwitchState = value;
        if (!value) { this.audioMusic.loop = false; this.stopMusic(); }
    }
    get audioEffectSwitchState(): boolean { return this._audioEffectSwitchState && !this.disposed; }
    set audioEffectSwitchState(value: boolean) {
        if (value === this._audioEffectSwitchState) return;
        this._audioEffectSwitchState = value;
        if (!value) {
            this.audioEffect.stop();
            this.stopAllLoopEffects();
            this.sessions.forEach(session => session.cancel());
        }
    }
    get musicProgress(): number { return this.audioMusic.progress; }
    set musicProgress(value: number) { this.audioMusic.progress = value; }

    init(path: string, bundle: AssetManager.Bundle): void { this.registerMusicAndEffect(path, bundle); }

    /** Register names from a loaded bundle; registering the same directory twice is harmless. */
    registerMusicAndEffect(path: string, bundle: AssetManager.Bundle): void {
        const owner = bundle ?? resources;
        for (const info of owner.getDirWithPath(path, AudioClip)) {
            const name = info.path.split('/').pop();
            if (!name) continue;
            const entry = { path: info.path, bundle: owner.name };
            const existing = this.assetsByName.get(name);
            if (existing && (existing.path !== entry.path || existing.bundle !== entry.bundle)) {
                error(`Duplicate audio name: ${name} (${existing.bundle}/${existing.path}, ${entry.bundle}/${entry.path})`);
                continue;
            }
            this.assetsByName.set(name, entry);
        }
    }

    createEffectSession(): AudioEffectSession {
        this.releaseWhenUnused = false;
        let session: AudioEffectSession;
        session = new AudioEffectSession(this, () => {
            this.sessions.delete(session);
            this.releaseIfUnused();
        });
        this.sessions.add(session);
        return session;
    }

    preloadEffects(names: readonly string[]): Promise<void> {
        this.releaseWhenUnused = false;
        return Promise.all(names.map(name => new Promise<void>((resolve, reject) => {
            this.loadClip(name, (failure) => failure ? reject(failure) : resolve());
        }))).then(() => undefined);
    }

    getCachedClip(name: string): AudioClip | null { return this.clips.get(name) ?? null; }

    /** Shared deduplicated loading retains exactly one reference per cached clip. */
    loadClip(name: string, complete: ClipComplete): void {
        if (this.disposed) { complete(new Error('AudioManager has been destroyed'), null); return; }
        const cached = this.clips.get(name);
        if (cached) { complete(null, cached); return; }
        const pending = this.loading.get(name);
        if (pending) { pending.callbacks.push(complete); return; }
        const entry = this.assetsByName.get(name);
        if (!entry) { complete(new Error(`Audio clip was not registered: ${name}`), null); return; }
        const request = { callbacks: [complete], generation: this.cacheGeneration };
        this.loading.set(name, request);
        resLoader.load(entry.bundle, entry.path, AudioClip, (failure: Error | null, clip: AudioClip) => {
            if (this.loading.get(name) !== request || request.generation !== this.cacheGeneration) return;
            this.loading.delete(name);
            if (!failure && clip && !this.disposed) {
                clip.addRef();
                this.clips.set(name, clip);
            }
            const problem = failure ?? (!clip ? new Error(`Audio clip was not loaded: ${name}`) : null);
            for (const callback of request.callbacks) {
                const cancelled = request.generation !== this.cacheGeneration || this.disposed;
                this.completeClip(callback, cancelled ? new Error('Audio cache released') : problem,
                    cancelled || problem ? null : clip);
            }
            this.releaseIfUnused();
        });
    }

    playSessionClip(clip: AudioClip, volume: number, callback?: Function): void {
        if (!this.audioEffectSwitchState) return;
        this.audioEffect.playSelf(clip, callback, volume * this._effectVolume);
    }

    setMusicCompleteCallback(callback: Function | null = null): void { this.audioMusic.onCompleteCallback = callback; }

    playMusic(url: string, isLoop = true, callback?: Function): void {
        const version = ++this.musicPlayRequestVersion;
        if (!this._audioMusicSwitchState || this.disposed) return;
        this.loadClip(url, (failure, clip) => {
            if (failure || !clip || version !== this.musicPlayRequestVersion || !this._audioMusicSwitchState || this.disposed) return;
            this.audioMusic.loop = isLoop;
            this.audioMusic.playSelf(clip, callback);
        });
    }

    playEffect(url: string, callback?: Function): void {
        if (!this.defaultSession) this.defaultSession = this.createEffectSession();
        this.defaultSession.playEffect(url, undefined, callback);
    }

    playLoopEffect(url: string, callback?: Function): void {
        if (!this.audioEffectSwitchState) return;
        this.requestedLoopEffects.add(url);
        const version = (this.loopVersions.get(url) ?? 0) + 1;
        this.loopVersions.set(url, version);
        this.loadClip(url, (failure, clip) => {
            if (failure || !clip) {
                if (this.loopVersions.get(url) === version) this.requestedLoopEffects.delete(url);
                return;
            }
            if (!this.audioEffectSwitchState || !this.requestedLoopEffects.has(url)
                || this.loopVersions.get(url) !== version) return;
            let effect = this.loopEffects.get(url);
            if (!effect || !effect.node?.isValid) {
                const node = new Node(`AudioLoopEffect_${url}`);
                node.parent = this.node;
                effect = node.addComponent(AudioEffect);
                effect.playOnAwake = false;
                effect.volume = this._effectVolume;
                this.loopEffects.set(url, effect);
            }
            effect.playLoopSelf(clip, callback);
        });
    }

    stopLoopEffect(url: string): void {
        this.requestedLoopEffects.delete(url);
        this.loopVersions.set(url, (this.loopVersions.get(url) ?? 0) + 1);
        this.loopEffects.get(url)?.stopLoopSelf();
        this.releaseIfUnused();
    }

    private stopAllLoopEffects(): void {
        this.requestedLoopEffects.clear();
        this.loopEffects.forEach(effect => effect.stopLoopSelf());
    }

    resumeAll(): void {
        this.resumeMusic();
        if (!this.audioEffectSwitchState) return;
        this.loopEffects.forEach((effect, name) => { if (this.requestedLoopEffects.has(name)) effect.play(); });
        this.sessions.forEach(session => session.resume());
    }
    pauseAll(): void {
        this.pauseMusic();
        this.audioEffect.pause();
        this.loopEffects.forEach(effect => effect.pause());
        this.sessions.forEach(session => session.pause());
    }
    resumeMusic(): void { if (this.audioMusic && this._audioMusicSwitchState) this.audioMusic.play(); }
    pauseMusic(): void { this.audioMusic?.pause(); }
    stopMusic(): void {
        ++this.musicPlayRequestVersion;
        if (this.audioMusic) { this.audioMusic.stop(); this.audioMusic.clip = null; }
        this.releaseIfUnused();
    }
    stopAll(): void {
        this.stopMusic();
        this.audioEffect?.stop();
        this.stopAllLoopEffects();
        this.sessions.forEach(session => session.cancel());
    }

    /** Stop users of the cache before dropping its owned references. Registrations remain reusable. */
    releaseCachedClips(): void {
        this.releaseWhenUnused = false;
        this.stopAll();
        this.sessions.forEach(session => session.cancel(true));
        this.audioMusic.clip = null;
        this.loopEffects.forEach(effect => { effect.clip = null; });
        ++this.cacheGeneration;
        const pending = [...this.loading.values()];
        this.loading.clear();
        const retained = [...this.clips.values()];
        this.clips.clear();
        for (const clip of retained) clip.decRef();
        for (const request of pending) for (const complete of request.callbacks) {
            this.completeClip(complete, new Error('Audio cache released'), null);
        }
    }

    /** Request cleanup after a screen closes without disrupting other sessions, music or loops. */
    releaseUnusedClips(): void {
        this.releaseWhenUnused = true;
        this.releaseIfUnused();
    }

    private releaseIfUnused(): void {
        if (!this.releaseWhenUnused || this.sessions.size || this.loading.size
            || this.audioMusic.clip || this.requestedLoopEffects.size) return;
        this.releaseWhenUnused = false;
        this.releaseCachedClips();
    }

    private completeClip(callback: ClipComplete, failure: Error | null, clip: AudioClip | null): void {
        try { callback(failure, clip); }
        catch (cause) { error(cause); }
    }

    protected onDestroy(): void {
        this.disposed = true;
        for (const session of [...this.sessions]) session.destroy();
        this.releaseCachedClips();
        this.assetsByName.clear();
        if (AudioManager._instance === this) AudioManager._instance = null!;
    }
}
