const NBTTagList = Java.type('net.minecraft.nbt.NBTTagList');
const NBTTagString = Java.type('net.minecraft.nbt.NBTTagString');

let utils = {
    addLore: function(item, prefix, value){
        
        const list = item
            .getNBT()
            .getCompoundTag("tag")
            .getCompoundTag("display")
            .getTagMap()
            .get("Lore")
    
        let done = false
        // Gets the current lore lines
        for (let i = 0; i < list.func_74745_c(); i++) {
            if (String(list.func_150307_f(i)).startsWith(prefix)){
                list.func_150304_a(i, new NBTTagString(prefix+value));
                done = true
            }
        }
        if(!done){
            list.func_74742_a( new NBTTagString(prefix+value))
        }
    
        item
            .getNBT()
            .getCompoundTag("tag")
            .getCompoundTag("display")
            .getRawNBT()
            .func_74782_a("Lore", list);
    },
    getSBID: function(item){
        return item.getNBT()?.getCompoundTag("tag")?.getCompoundTag("ExtraAttributes")?.getString("id") || null
    },
    calculateDistance: function(p1, p2) {
        var a = p2[0] - p1[0];
        var b = p2[1] - p1[1];
        var c = p2[2] - p1[2];
    
        let ret = Math.sqrt(a * a + b * b + c * c)
    
        if(ret<0){
            ret *= -1
        }
        return ret;
    },
    calculateDistanceQuick: function(p1, p2) {
        var a = p2[0] - p1[0];
        var b = p2[1] - p1[1];
        var c = p2[2] - p1[2];
    
        let ret = a * a + b * b + c * c
    
        if(ret<0){
            ret *= -1
        }
        return ret;
    },
    /**
     * Please try not to use this
     * it has O(n!)
     * only use if points < 10 or something
     * D:
     * @param {*} startPoint 
     * @param {*} points 
     * @returns 
     */
    fastestPathThrough:function(startPoint, points){
        let ret = []
        while(ret.length<points.length){
            ret.push(ret.length)
        }
        
        let allOrders = utils.permutation(ret)
    
        let lastOrder = []
        let lastOrderLength = Infinity
       
        allOrders.forEach((order)=>{
            let lastPoint = startPoint
            let positions = order.map((a)=>{
                return points[a]
            })
            let len = 0
            positions.forEach((pos)=>{
                len += utils.calculateDistance(lastPoint,pos)
                lastPoint = pos
            })
    
            if(len < lastOrderLength){
                lastOrder = order
                lastOrderLength = len
            }
        })
    
        
        return lastOrder;
    },
    permutation:function(array) {
        function p(array, temp) {
            var i, x;
            if (!array.length) {
                result.push(temp);
            }
            for (i = 0; i < array.length; i++) {
                x = array.splice(i, 1)[0];
                p(array, temp.concat(x));
                array.splice(i, 0, x);
            }
        }
    
        var result = [];
        p(array, []);
        return result;
    }
}

module.exports = utils