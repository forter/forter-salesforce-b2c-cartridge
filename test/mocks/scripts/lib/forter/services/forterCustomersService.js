function ForterCustomersService() {
    return {
        send: function () {
            return '{"status":"success","message":"Customer account data saved"}';
        }
    };
}

module.exports = ForterCustomersService;
