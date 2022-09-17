class CategoryManager {
    constructor(){
        this.categorys = {}

        this.arr = []
    }

    addCategory(category){
        // this.pages = this.pages.filter(a=>a.name!==category.name)

        this.categorys[category.name] = (category)
        this.update()
    }

    deleteCategory(category){
        delete this.categorys[category.name]
        this.update()
    }

    update(){
        
        this.arr = Object.values(this.categorys).sort((a, b)=>{
            return b.priority - a.priority
        })
    }
}


if(!global.soopyv2CategoryManager){
    global.soopyv2CategoryManager = new CategoryManager()
    
    register("gameUnload", ()=>{
        global.soopyv2CategoryManager = undefined
    })
}

export default global.soopyv2CategoryManager