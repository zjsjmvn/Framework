# 红点系统说明文档

## 说明

该红点系统按照树形结构设计的存储结构。定义好ui对应的path，会根据path生成一个节点树。path需要用下划线(_)分割。

举例path定义：
场景中存在打开装备界面的按钮EquipmentBtn，打开装备界面后有武器栏，护甲栏，等。
那么武器栏的path可以定义为:EquipmentBtn_WeaponSlot。
节点的内容包含value：

```typescript
    public value: number = 0
```

value，代表这个节点的值，用来显示红点上的数字。
当武器栏有更好的装备可穿戴时：path对应对象的值+1，更新节点的值，在更新节点值时，会调用父节点更新节点值。

```typescript
    public updateValue(newValue?) {
        if (newValue !== undefined && newValue !== null) {
            if (this.childrenMap != null && this.childrenMap.size != 0) {
                error("不允许直接改变非叶子节点的值：" + this.fullPath);
            }

        } else {
            newValue = 0;
            if (this.childrenMap != null && this.childrenMap.size != 0) {
                this.childrenMap.forEach((value, key) => {
                    newValue += value.value;
                })
            }
        }
        if (this.value == newValue) {
            return;
        }
        this.value = newValue;
        this.onValueChangeCallback && this.onValueChangeCallback(newValue);
        this.parent && this.parent.updateValue();
    }

```

当护甲栏和武器栏都有更好的装备时，那么都显示红点。
因为他们的父节点都是EquipmentBtn，那么EquipmentBtn的节点的值就是2。


