let Executors = Java.type("java.util.concurrent.Executors")

class NonPooledThread {
    constructor(fun) {
        this.fun = fun
        this.executor = Executors.newSingleThreadExecutor()
    }

    start() {
        this.executor.execute(this.fun)
    }
}

export default NonPooledThread