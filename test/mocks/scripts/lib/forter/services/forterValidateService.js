function ForterValidateService() {
    return {
        validate: function () {
            return {
                ok: true,
                object: {
                    text: '{"status":"success","transaction":"00140401","action":"approve","message":" | Link in portal: https://portal.forter.com/dashboard/00140401","reasonCode":"Test","additionalTags":""}'
                }
            };
        }
    };
}

module.exports = ForterValidateService;
