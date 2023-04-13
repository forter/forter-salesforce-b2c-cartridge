
function searchOrders() {
    return {
        count: 0
    };
}

function getOrder() {
    return {
        custom: {
            forterRetryNumber: 1
        },
        defaultShipment: {
            shippingAddress: true
        },
        orderNo: '00140401',
        originalOrderNo: '00140401',
        creationDate: {
            getTime: function () {
                return 1415273168000;
            }
        },
        customerEmail: 'some Email',
        status: 'some status',
        productQuantityTotal: 1,
        totalGrossPrice: {
            available: true,
            value: 180.00,
            currencyCode: 'USD'
        },
        totalTax: {
            available: true,
            value: 20.00
        },
        shippingTotalPrice: {
            available: true,
            value: 20.00,
            subtract: function () {
                return {
                    value: 20.00
                };
            }
        },
        discounts: [],
        adjustedShippingTotalPrice: {
            value: 20.00,
            available: true
        },
        adjustedMerchandizeTotalPrice: {
            value: 110.00,
            available: true
        },
        shipments: [{
            id: 'me',
            adjustedShippingTotalPrice: {
                value: 200,
                currencyCode: 'USD'
            },
            shippingAddress: {
                firstName: 'Vo',
                lastName: 'NE',
                address1: 'addr 1',
                address2: '',
                postalCode: '10004',
                city: 'Chern',
                stateCode: 'NY',
                countryCode: {
                    value: 'us'
                },
                phone: '333-333-3333'
            },
            getShippingMethod: function () {
                return {
                    getDisplayName: function () {
                        return 'Ground';
                    }
                };
            },
            productLineItems: {
                size: function () {
                    return 1;
                }
            }
        }],
        getPaymentInstruments: function () {
            return [
                {
                    paymentMethod: 'CREDIT_CARD',
                    creditCardExpirationMonth: 10,
                    creditCardHolder: 'Vo',
                    creditCardType: 'VISA',
                    creditCardNumber: '4111111111111111',
                    creditCardNumberLastDigits: '1111',
                    creditCardExpirationYear: 2019,
                    custom: {
                        authorize_net_authorization_json: '{"avsStreetResult":"","avsZipResult":"","avsResultCode":"Y","cvvResultCode":"P","authCode":"8U1CJD","transId":"40038302674","errors":{"errorCode":"","errorText":""},"messages":{"code":"1","description":"This transaction has been approved."}}'
                    }
                }
            ];
        },
        getAdjustedMerchandizeTotalPrice: function () {
            return {
                subtract: function () {
                    return {
                        value: 110.00
                    };
                },
                add: function () {
                    return {
                        value: 110.00
                    };
                },
                value: 110.00,
                available: true
            };
        },
        getMerchandizeTotalPrice: function () {
            return {
                subtract: function () {
                    return {
                        value: 100.00
                    };
                },
                add: function () {
                    return {
                        value: 110.00
                    };
                },
                value: 110.00,
                available: true
            };
        },
        getShippingTotalPrice: function () {
            return {
                subtract: function () {
                    return {
                        value: 10.00
                    };
                },
                value: 10.00,
                available: true
            };
        },
        getAdjustedShippingTotalPrice: function () {
            return {
                subtract: function () {
                    return {
                        value: 10.00
                    };
                },
                value: 10.00,
                available: true
            };
        },
        getCouponLineItems: function () {
            return {
                isEmpty: function () {
                    return true;
                }
            };
        },
        customer: {
            ID: 123456,
            profile: {
                firstName: 'Vo',
                lastName: 'Ne',
                email: 'some@email.com',
                getCreationDate: function () {
                    return {
                        getTime: function () {
                            return 1415273168000;
                        }
                    };
                }
            }
        },
        productLineItems: [
            {
                productID: '111',
                productName: 'Product 1',
                quantityValue: 1,
                adjustedPrice: {
                    value: 100,
                    currencyCode: 'USD'
                },
                getProduct: function () {
                    return {
                        getCategories: function () {
                            return {
                                isEmpty: function () {
                                    return false;
                                },
                                '0': {
                                    getDisplayName: function () {
                                        return 'Category 1';
                                    }
                                }
                            };
                        }
                    };
                }
            },
            {
                productID: '222',
                productName: 'Product 2',
                quantityValue: 1,
                adjustedPrice: {
                    value: 200,
                    currencyCode: 'USD'
                },
                getProduct: function () {
                    return {
                        getCategories: function () {
                            return {
                                isEmpty: function () {
                                    return false;
                                },
                                '0': {
                                    getDisplayName: function () {
                                        return 'Category 2';
                                    }
                                }
                            };
                        }
                    };
                }
            }
        ],
        getProductLineItems: function () {
            return {
                size: function () {
                    return 1;
                }
            };
        },
        giftCertificateLineItems: [],
        getGiftCertificateLineItems: function () {
            return {
                size: function () {
                    return 0;
                }
            };
        },
        billingAddress: {
            firstName: 'Vo',
            lastName: 'NE',
            address1: 'addr 1',
            address2: '',
            postalCode: '10004',
            city: 'Chern',
            stateCode: 'NY',
            countryCode: {
                value: 'us'
            },
            phone: '333-333-3333'
        }
    };
}

module.exports = {
    searchOrders: searchOrders,
    getOrder: getOrder
};
