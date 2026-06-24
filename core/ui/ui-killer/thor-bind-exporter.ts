import { Component, Node, sp } from "cc";
import VMBase from "../mvvm/vm-base";

/** Thor 绑定类型导出工具：只生成文本，不处理剪贴板或编辑器 UI。 */
export default class ThorBindExporter {
    public static exportComponent(componentScript: Component): string {
        const lines: string[] = ["    //#region uikiller"];
        for (const key in componentScript) {
            const element = (componentScript as any)[key];
            if (!(element instanceof Node) || !ThorBindExporter.canExportFieldName(key)) {
                continue;
            }
            const info = ThorBindExporter.exportNodeInfo(element);
            lines.push(`    public ${key}: Node${info ? ` & { ${info} }` : ""};`);
        }
        lines.push("    //#endregion");
        return `${lines.join("\n")}\n`;
    }

    private static exportNodeInfo(node: Node): string {
        const parts: string[] = [];
        for (const key in node) {
            const value = (node as any)[key];
            if (value instanceof Component && !(value instanceof VMBase)) {
                const typeName = ThorBindExporter.getComponentName(value);
                if (typeName) {
                    parts.push(`$${typeName}: ${ThorBindExporter.getComponentTypeReference(typeName)}`);
                }
                continue;
            }
            if (!(value instanceof Node) || key === "_parent" || key === "_scene") {
                continue;
            }
            if (!ThorBindExporter.canExportNode(value)) {
                continue;
            }
            const childInfo = ThorBindExporter.exportNodeInfo(value);
            parts.push(`${value.name}: Node${childInfo ? ` & { ${childInfo} }` : ""}`);
        }
        return parts.join(", ");
    }

    private static getComponentName(component: Component): string {
        const match = component.name.match(/<.*>$/);
        return match ? match[0].slice(1, -1) : component.name;
    }

    private static getComponentTypeReference(typeName: string): string {
        return (sp as any)[typeName] !== undefined ? `sp.${typeName}` : typeName;
    }

    private static canExportNode(node: Node): boolean {
        return ThorBindExporter.canExportFieldName(node.name)
            && node.name.toLocaleLowerCase() !== "_name"
            && !node.name.startsWith("New");
    }

    private static canExportFieldName(name: string): boolean {
        return !!name
            && !/^[0-9]*$/.test(name[0])
            && name.indexOf(" ") === -1
            && name.indexOf("-") === -1;
    }
}
