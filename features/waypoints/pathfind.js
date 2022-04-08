import FlatQueue from "../../datastructures/flatqueue"

const directions = [
    [1,0,0,1],
    [0,1,0,1],
    [0,0,1,1],
    [-1,0,0,1],
    [0,-1,0,1],
    [0,0,-1,1],
    [1,1,0,Math.SQRT2],
    [1,-1,0,Math.SQRT2],
    [-1,1,0,Math.SQRT2],
    [-1,-1,0,Math.SQRT2],
    [1,0,1,Math.SQRT2],
    [1,0,-1,Math.SQRT2],
    [-1,0,1,Math.SQRT2],
    [-1,0,-1,Math.SQRT2],
    [0,1,1,Math.SQRT2],
    [0,1,-1,Math.SQRT2],
    [0,-1,1,Math.SQRT2],
    [0,-1,-1,Math.SQRT2]
]

class Path{
    constructor(startLocation, endLocation){
        this.startLocation = startLocation
        this.endLocation = endLocation

        this.points = []
    }

    getPoints(){
        return this.points
    }

    calculate(){
        this.locs = {}
        this.points = []
        this.locs[this.startLocation.x+","+this.startLocation.y+","+this.startLocation.z]= {
            location: this.startLocation,
            parent: null,
            distance: 0,
            huristic: (Math.abs(this.startLocation.x-this.endLocation.x)+Math.abs(this.startLocation.y-this.endLocation.y)+Math.abs(this.startLocation.z-this.endLocation.z))
        }

        this.heap = new FlatQueue()

        this.heap.push(this.startLocation.x+","+this.startLocation.y+","+this.startLocation.z, this.locs[this.startLocation.x+","+this.startLocation.y+","+this.startLocation.z].huristic)

        let i = 0
        while(!this._iterate() && i<100000){
            i++
        }
    }

    _iterate(){
        let currentKey = this.heap.pop()
        let current = this.locs[currentKey]
        if(current.location.x === this.endLocation.x && current.location.y === this.endLocation.y && current.location.z === this.endLocation.z){
            this.points.push([current.location.x, current.location.y, current.location.z])
            while(current.parent){
                current = this.locs[current.parent]

                this.points.push([current.location.x, current.location.y, current.location.z])
            }
            return true
        }

        for(let dir of directions){
    
            let newLoc = {
                x: current.location.x + dir[0],
                y: current.location.y + dir[1],
                z: current.location.z + dir[2]
            }

            if(!this.locs[newLoc.x + "," + newLoc.y + "," + newLoc.z]){
                
                if(World.getBlockAt(newLoc.x, newLoc.y, newLoc.z).getType().getID() === 0 && World.getBlockAt(newLoc.x, newLoc.y+1, newLoc.z).getType().getID() === 0){
                    this.locs[newLoc.x + "," + newLoc.y + "," + newLoc.z] = {
                        location: newLoc,
                        parent: currentKey,
                        distance: current.distance+1,
                        huristic: Math.hypot((newLoc.x-this.endLocation.x),(newLoc.y-this.endLocation.y),(newLoc.z-this.endLocation.z))+(current.distance+dir[3])/2
                    }

                    this.heap.push(newLoc.x + "," + newLoc.y + "," + newLoc.z, this.locs[newLoc.x + "," + newLoc.y + "," + newLoc.z].huristic)
                }
            }
        }

        return false
    }
}

export default Path