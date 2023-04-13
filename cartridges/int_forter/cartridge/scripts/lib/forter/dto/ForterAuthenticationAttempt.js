/**
 * ForterAuthenticationAttempt class is the DTO object of the general parameters to Update Forter with authentication attempts.
 *
 * To include this script use:
 * var ForterAuthenticationAttempt = require("~/cartridge/scripts/lib/forter/dto/forterAuthenticationAttempt");
 * @param {Object} args - Map of objects to fill the request
 * @param {dw.customer.Customer} currentCustomer - current customer
 * @param {dw.system.Request} currentRequest - current request
 */
function ForterAuthenticationAttempt(args, currentCustomer, currentRequest) {
    function ForterConnectionInformation(req) {
        this.customerIP = req.httpRemoteAddress;  // Required
        this.userAgent = req.httpUserAgent;          // Required
        this.forterTokenCookie = '';                     // Conditional

        if (!empty(request.session.privacy.ftrToken)) {
            this.forterTokenCookie = request.session.privacy.ftrToken;
        }
    }

    function ForterCreditCardVerification(creditCardVerification) {
        this.avsFullResult = creditCardVerification.avsFullResult;
        this.cvvResult = creditCardVerification.cvvResult;
        this.authorizationCode = creditCardVerification.authorizationCode;
        this.processorResponseCode = creditCardVerification.processorResponseCode;
        this.processorResponseText = creditCardVerification.processorResponseText;
    }

    function ForterPaypalVerificationResults(paypalVerificationResults) {
        this.payerId = paypalVerificationResults.payerId;
        this.payerEmail = paypalVerificationResults.payerEmail;
        this.paymentMethod = paypalVerificationResults.paymentMethod;
        this.paymentStatus = paypalVerificationResults.paymentStatus;
        this.payerStatus = paypalVerificationResults.payerStatus;
        this.payerAddressStatus = paypalVerificationResults.payerAddressStatus;
        this.payerAccountCountry = paypalVerificationResults.payerAccountCountry;
        this.protectionEligibility = paypalVerificationResults.protectionEligibility;
        this.paymentId = paypalVerificationResults.paymentId;
        this.authorizationId = paypalVerificationResults.authorizationId;
        this.correlationId = paypalVerificationResults.correlationId;
        this.checkoutToken = paypalVerificationResults.checkoutTokn;
        this.paymentGatewayData = paypalVerificationResults.paymentGatewayData;
        this.fullPaypalResponsePayload = paypalVerificationResults.fullPaypalResponsePayload;
    }

    function ForterBankTransferVerificationResults(bankTransferVerificationResults) {
        this.serviceName = bankTransferVerificationResults.serviceName;
        this.accountHolderFirstName = bankTransferVerificationResults.accountHolderFirstName;
        this.accountHolderLastName = bankTransferVerificationResults.accountHolderLastName;
        this.accountHolderFullName = bankTransferVerificationResults.bankAccountIdentifier;
        this.paymentSuccessStatus = bankTransferVerificationResults.paymentSuccessStatus;
        this.paymentGatewayData = bankTransferVerificationResults.paymentGatewayData;
    }

    function ForterSimplifiedVerification(verificationMethod, verified) {
        this.verificationMethod = verificationMethod;
        this.verified = verified;
    }

    function ForterPhoneVerification(phoneVerification, cCustomer) {
        this.phone = phoneVerification.phone;
        this.smsVerification = {
            sent: phoneVerification.sent,
            verified: phoneVerification.verified
        };
        this.timeSent = Number((cCustomer.profile.getCreationDate().getTime() / 1000).toFixed());
    }

    function ForterEmailVerification(emailVerification, cCustomer) {
        this.email = emailVerification.email;
        this.emailRole = emailVerification.emailRole;
        this.emailVerification = {
            sent: emailVerification.sent,
            verified: emailVerification.verified
        };
        this.updateTimes = {
            creationTime: Number((cCustomer.profile.getCreationDate().getTime() / 1000).toFixed())
        };
        this.resourceOperation = emailVerification.resourceOperation;
        this.isPrimary = true;
    }

    function ForterDocumentVerification(documentVerification, cCustomer) {
        this.documentType = documentVerification.documentType;
        this.documentSource = documentVerification.documentSource;
        this.nationality = documentVerification.nationality;
        this.documentIssuingState = documentVerification.documentIssuingState;
        this.documentNumber = documentVerification.documentNumber;
        this.documentFirstName = documentVerification.documentFirstName;
        this.documentLastName = documentVerification.documentLastName;
        this.documentDateOfBirth = documentVerification.documentDateOfBirth;
        this.documentExpiration = documentVerification.documentExpiration;
        this.eventTime = Number((cCustomer.profile.getCreationDate().getTime() / 1000).toFixed());
        this.documentVerificationServiceResponsePayload = {};
    }

    function ForterPaymentInstrumentVerification(paymentInstrumentVerification) {
        this.token = paymentInstrumentVerification.token;
        this.lastFourDigits = paymentInstrumentVerification.lastFourDigits;
        this.creditCardManuallyTypedIn = paymentInstrumentVerification.creditCardManuallyTypedIn;
        this.cvvManuallyTypedIn = paymentInstrumentVerification.cvvManuallyTypedIn;
        this.cameraCaptured = paymentInstrumentVerification.cameraCaptured;
    }

    function ForterAdditionalAuthenticationMethod(additionalAuthenticationMethod, cCustomer) {
        this.verificationOutcome = additionalAuthenticationMethod.verificationOutcome;
        this.correlationId = additionalAuthenticationMethod.correlationId;
        if (additionalAuthenticationMethod.phoneVerification) {
            this.phoneVerification = new ForterPhoneVerification(additionalAuthenticationMethod.phoneVerification, cCustomer);
        }
        if (additionalAuthenticationMethod.emailVerification) {
            this.emailVerification = new ForterEmailVerification(additionalAuthenticationMethod.emailVerification, cCustomer);
        }
        if (additionalAuthenticationMethod.documentVerification) {
            this.documentVerification = new ForterDocumentVerification(additionalAuthenticationMethod.documentVerification, cCustomer);
        }
        if (additionalAuthenticationMethod.oneTimePasswordVerification) {
            this.oneTimePasswordVerification = new ForterSimplifiedVerification(additionalAuthenticationMethod.verificationMethod, additionalAuthenticationMethod.status);
        }
        if (additionalAuthenticationMethod.paymentInstrumentVerification) {
            this.paymentInstrumentVerification = new ForterPaymentInstrumentVerification(additionalAuthenticationMethod.paymentInstrumentVerification);
        }
    }

    this.accountId = currentCustomer.ID;
    this.eventTime = (new Date()).getTime();
    this.connectionInformation = new ForterConnectionInformation(currentRequest);

    if (args.creditCardVerification) {
        this.creditCardVerification = new ForterCreditCardVerification(args.creditCardVerification);
    }
    if (args.paypalVerificationResults) {
        this.paypalVerificationResults = new ForterPaypalVerificationResults(args.paypalVerificationResults);
    }
    if (args.bankTransferVerificationResults) {
        this.bankTransferVerificationResults = new ForterBankTransferVerificationResults(args.bankTransferVerificationResults);
    }
    if (args.additionalAuthenticationMethod) {
        this.additionalAuthenticationMethod = new ForterAdditionalAuthenticationMethod(args.additionalAuthenticationMethod, currentCustomer);
    }
    this.additionalInformation = {};
}

module.exports = ForterAuthenticationAttempt;
