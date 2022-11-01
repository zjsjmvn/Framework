export let PromiseHandler = (promise) => promise.then(data => [null, data]).catch(err => [err])
