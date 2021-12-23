
class FakeRequireToggle{
    constructor(val){
        this.val = val

        this.thisToggleEvents = []

        this.toggleObject = {
            addEvent: (event)=>{
                this.thisToggleEvents.push(event)
            }
        }
    }

    set(newVal){
        if(this.val === newVal) return
        this.val = newVal

        this.thisToggleEvents.forEach(e=>e._trigger(this, [this.val]))
    }

    getValue(){
        return this.val
    }
}

export default FakeRequireToggle