function ForterLogger() {
    return {
        error: function (msg) {
            console.log(msg);
        },
        debug: function (msg) {
            console.log(msg);
        }
    };
}

module.exports = ForterLogger;
