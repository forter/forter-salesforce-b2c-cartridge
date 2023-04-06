var paypalAdmin = (function($) {
	
	var loadMask;
	var actionFormWindow;
	var transactionDetailWindow;
	var $window = $(window);

	function initTextareaCharectersLeft(parent) {
		parent = parent || document;
		$(parent).find('textarea[data-maxcount]').each(function() {
			var $textarea = $(this);
			var maxCount = $textarea.data('maxcount');
			var $countInput = $textarea.parent().find('.js_textarea_count');
			$countInput.text(maxCount);
			$textarea.on('keyup', function() {
				var text = $textarea.val();
				var left = maxCount - text.length;
				if(left >= 0) {
					$countInput.text(left);
				}
				$textarea.val(text.slice(0, maxCount));
			});
		});
	}
	
	function initActionFormEvents(parent, action) {
		$(parent).find('form').submit(function() {
			submitActionForm($(this), action);
			return false;
		});
	}
	
	function isFormValid($form) {
		var countErrors = 0;
		$form.find('.paypal_error_msg_box').hide();
		$form.find('.paypal_error_field').removeClass('paypal_error_field');
		$form.find('[data-validation]').not(':disabled').each(function() {
			var currentError = 0;
			var $field = $(this);
			var rules = $field.data('validation').replace(/\s/, '').split(',');
			var value = $.trim($field.val());
			$.each(rules, function(i, rule) {
				switch(rule) {
					case 'required':
						if(!value.length) {
							currentError++;
						}
						break;
					case 'float':
						if(isNaN(parseFloat(value)) || !isFinite(value)) {
							currentError++;
						}
						break;
					case 'greaterzero':
						if(parseFloat(value) <= 0) {
							currentError++;
						}
						break;
				}
				if(currentError) {
					var name = $field.data('general-validation') || $field.attr('name');
					$field.parents('tr').addClass('paypal_error_field');
					$form.find('.paypal_error_msg_box_' + name + '_' + rule).show();
					countErrors += currentError;
					recalculateModalWindowSize();
					return false;
				}
			});
		});
		return !!countErrors;
	}
	
	function showErrorMessage(text) {
		Ext.Msg.show({
			title: paypalAdmin.resources.errorMsgTitle,
			msg: text,
			buttons: Ext.Msg.OK,
			icon: Ext.MessageBox.ERROR
		});
	}
	
	function submitCaptureForm($form, responseData) {
		$form.find('[name=methodName]').val('DoCapture');
		$form.find('[name=authorizationId]').val(responseData.transactionid);
		submitActionForm($form, 'capture');
	}
	
	function submitActionForm($form, action) {
		if(isFormValid($form)) return false;
		
		loadMask.show(action);
		$.ajax({
			url: $form.attr('action'),
			data: $form.serialize(),
			dataType: 'json',
			error: function() {
				loadMask.hide();
				transactionDetailWindow.close();
				actionFormWindow.close();
			},
			success: function(data) {
				loadMask.hide();
				if(data.ack == 'Success' && data.result == 'Success') {
					if(action == 'sale') {
						submitCaptureForm($form, data);
					}
					actionFormWindow.close();
					if(paypalAdmin.currentOrderNo) {
						loadOrderTransaction(paypalAdmin.currentOrderNo, data.transactionid, paypalAdmin.isCustomOrder);
					} else {
						window.location.reload();
					}
				} else {
					data.l_longmessage0 ? showErrorMessage(data.l_longmessage0) : showErrorMessage(paypalAdmin.resources.serverError);
				}
			}
		});
	}
	
	function initOrderTransaction() {
		paypalAdmin.currentOrderNo = $('.js_paypalbm_order_detail').data('orderno');
		paypalAdmin.isCustomOrder = $('.js_paypalbm_order_detail').data('iscustom');
		$('.js_paypal_action').on('click', function() {
			var $button = $(this);
			var action = $button.data('action');
			var $formContainer = $('#paypal_' + action + '_form');
			var formContainerClass = 'js_paypal_action_form_container_' + action;

			actionFormWindow = new Ext.Window({
				title: $button.data('title'),
				width: 700,
				modal: true,
				autoScroll: true,
				cls: 'paypalbm_window_content ' + formContainerClass,
				listeners: {
					render: function() {
						actionFormWindow.body.insertHtml('afterBegin', $formContainer.html());
						initTextareaCharectersLeft(actionFormWindow.body.dom);
						initActionFormEvents(actionFormWindow.body.dom, action);
					}
				},
				buttons: [
					{
						text: paypalAdmin.resources.submit,
						handler: function() {
							submitActionForm($('.' + formContainerClass).find('form'), action);
						}
					},
					{
						text: paypalAdmin.resources.cancel,
						handler: function() {
							actionFormWindow.close();
						}
					}
				]
			});
			actionFormWindow.show();
		});
		
		$('.js_paypalbm_order_transactions_ids').on('change', function() {
			var transactionId = $(this).val();
			loadOrderTransaction(paypalAdmin.currentOrderNo, transactionId, paypalAdmin.isCustomOrder);
		});
	}

	function loadOrderTransaction(orderNo, transactionId, isCustom) {
		var data = {
			format: 'ajax',
			orderNo: orderNo || null,
			transactionId: transactionId || null,
			isCustomOrder: isCustom || null
		};
		loadMask.show();
		$.ajax({
			url: paypalAdmin.urls.orderTransaction,
			data: data,
			error: function(data) {
				loadMask.hide();
				transactionDetailWindow && transactionDetailWindow.close();
			},
			success: function(data) {
				loadMask.hide();
				if(transactionDetailWindow) {
					$('#' + transactionDetailWindow.body.id).html(data);
					transactionDetailWindow.setHeight('auto');
					transactionDetailWindow.center();
				} else {
					$('.js_paypalbm_content').html(data);
				}
				initOrderTransaction();
			}
		});
	}

	function loadNewTransactionForm(url) {
		var data = {
				format: 'ajax'
			};
			loadMask.show();
			$.ajax({
				url: url,
				data: data,
				error: function(data) {
					loadMask.hide();
					transactionDetailWindow && transactionDetailWindow.close();
				},
				success: function(data) {
					actionFormWindow = transactionDetailWindow;
					loadMask.hide();
					if(transactionDetailWindow) {
						$('#' + transactionDetailWindow.body.id).html(data);
						recalculateModalWindowSize();
					} else {
						$('.js_paypalbm_content').html(data);
					}
					toggleFields();
					shippingDisable();
					initTextareaCharectersLeft(transactionDetailWindow.body.dom);
					setChangeTypeHandler($('.js_paypal_transaction_type'));
					referenceIdCheck($('#referenceInput'));
					initTotalAmountCount($('#totalAmount'), $('.totalCount'));
				}
			})
	}

	function initTotalAmountCount($totalAmountField, $countedFields) {
		$countedFields.bind('input change', function() {
			var init = 0;
			var curr = $totalAmountField.data('currency');

			$countedFields.each(function(pos, el) {
				var val = el.value.trim().length === 0 ? 0 : el.value;
				var err = isNaN(val) || !isFinite(val);
				init += err ? NaN : parseFloat(val);
			})

			if (!isNaN(init) || isFinite(init)) {
				$totalAmountField.html('<b>' + init + ' ' + curr + '</b>');
			} else {
				$totalAmountField.html('<b>' + N/A + ' ' + curr + '</b>');
			}
		})
	}

	function referenceIdCheck($referenceInput){
		$referenceInput.bind('input change', function(){
			var method = $('input[name=methodName]').val() === 'DoReferenceTransaction';
			var enterValue = $.trim($(this).val());
			var reg = new RegExp('^B');
			var indexValue = !reg.test(enterValue) && !!enterValue[0];
			var $inputs = $('.js_paypal_required_toggle input');
			if(method && indexValue) {
				$inputs.removeAttr('disabled');
			} else {
				$inputs.attr('disabled', 'disabled');
			}
		});
	}

	function submitNewTransactionForm ($form) {
		if(isFormValid($form)) return false;
		var transactionAmt = parseFloat($form.find('input[name=itemamt]').val());
		var taxAmt = parseFloat($form.find('input[name=taxamt]').val());
		var shipingAmt = parseFloat($form.find('input[name=shippingamt]').val());
		var shippingFullName = $form.find('#shippingFirstName').val() + ' ' + $form.find('#shippingLastName').val();
		var amt = transactionAmt + taxAmt + shipingAmt;

		$form.find('input[name=shiptoName]').val(shippingFullName);
		$form.find('input[name=amt]').val(amt.toString());
		submitActionForm($form, '');
	}

	function initEvents() {
		$('.js_paypal_show_detail').on('click', function() {
			var $button = $(this);
			transactionDetailWindow = new Ext.Window({
				title: $button.attr('title'),
				width: 780,
				height: 200,
				modal: true,
				autoScroll: true,
				cls: 'paypalbm_window_content'
			});
			transactionDetailWindow.show();
			loadOrderTransaction($button.data('orderno'), $button.data('transactionid'), $button.data('iscustom'));
			return false;
		});
		
		$('.js_paypal_create_reference_transaction').on('click', function() {
			var $button = $(this);
			paypalAdmin.currentOrderNo = null;
			transactionDetailWindow = new Ext.Window({
				title: $button.attr('title'),
				width: 550,
				height: 200,
				modal: true,
				autoScroll: true,
				cls: 'paypalbm_window_content',
				buttons: [{
					text: paypalAdmin.resources.submit,
					handler: function() {
						submitNewTransactionForm($('.paypal_new_transaction_form'));
					}
				}, {
					text: paypalAdmin.resources.cancel,
					handler: function() {
						transactionDetailWindow.close();
					}
				}]
			});
			transactionDetailWindow.show();
			loadNewTransactionForm($button.data('url'));
			return false;
		});
		
		$('.js_paypalbm_switch').on('click', function() {
			var blockId = $(this).attr('href');
			$('.js_paypalbm_switch_block').hide();
			$(blockId).show();
			return false;
		});
	}

	function toggleFields() {
		$('.js_paypal_toggle_button').on('click', function(e) {
			var $button = $(this);
			if($button.data('hide')) {
				$button.text($button.data('text-show'));
				$button.data('hide', false);
			} else {
				$button.text($button.data('text-hide'));
				$button.data('hide', true);
			}
			$button.parent('div').find('table').toggle($button.data('hide'));
			recalculateModalWindowSize();
			return false;
		});
	}

	function shippingDisable() {
		$('.js_paypal_disable_button').on('click', function (e) {
			var $button = $(this);
			var $shippingInputs = $('#shippingInfo').find(':input');
			var $shipingAmt = $('#shippingInfo input[name=shippingamt]');
			if($button.data('disable')) {
				$('#shippingInfo tr').removeClass('paypal_error_field');
				$button.text($button.data('text-enable'));
				$button.data('disable', false);
				$shippingInputs.attr('disabled', 'disabled');
				$shipingAmt.val('0');
			} else {
				$shippingInputs.removeAttr('disabled');
				$button.text($button.data('text-disable'));
				$button.data('disable', true);
			}
			return false
		})
	}

	function recalculateModalWindowSize(el) {
		if (typeof el == 'undefined') {
			$('.x-window').each(function() {
				recalculateModalWindowSize($(this).attr('id'));
			});
			return;
		}
		if (el.ctype == 'Ext.Component') {
			var modalWindow = el;
		}
		if (el.jquery) {
			el = el.parents('.x-window').attr('id');
		}
		if (typeof el == 'string') {
			var modalWindow = Ext.getCmp(el);
		}
		var windowHeight = $window.height() - 30;
		modalWindow.setHeight('auto');
		var modalWindowHeight = modalWindow.getSize().height;
		if (modalWindowHeight > windowHeight) {
			modalWindow.setHeight(windowHeight);
		}
		modalWindow.center();
	}
	
	function setChangeTypeHandler($select){
		var $billingAddress = $('.js_paypal_billing_address');
		var $referenceInput = $('#referenceInput');
		var $recurringInput = $('#recurringInput');
		var $creditCard = $('.js_paypal_credit_card');
		var $acctInput = $('#acctInput');
		var $orderOption = $('.paypal_new_transaction_form option[value="Order"]');
		var $paymentType = $('.paypal_new_transaction_form select[name=paymentAction]');
		var $method = $('.paypal_new_transaction_form input[name=methodName]');
		var $countriesSelect = $('.paypal_new_transaction_form select[name=countrycode]');
		var $requiredToggleInputs = $('.js_paypal_required_toggle input');
		var status;

		$select.on('change', function(){
			if($(this).find(':selected').val() != 'ba') {
				$('#paymentInfo tr').removeClass('paypal_error_field');
				status = $('.js_paypal_required_toggle').first().find('input').attr('disabled');
				$billingAddress.find('input').removeAttr('disabled');
				$billingAddress.show();
				$recurringInput.attr('disabled','disabled');
				$countriesSelect.attr('disabled','disabled');
				$countriesSelect.removeAttr('disabled');
				$referenceInput.attr('disabled','disabled').parents('tr').hide();
				$creditCard.find('input').removeAttr('disabled');
				$acctInput.show();
				$orderOption.attr('disabled','disabled');
				$method.val('DoDirectPayment');
				$requiredToggleInputs.attr('data-validation', 'required');
				if(!$paymentType.val()) {
					$paymentType.find('option').first().attr('selected','selected');
					$paymentType.find('option').last().removeAttr('selected');
				}
			} else {
				$('#paymentInfo tr').removeClass('paypal_error_field');
				$requiredToggleInputs.data('validation', '');
				$billingAddress.find('input').attr('disabled','disabled');
				$billingAddress.hide();
				$recurringInput.removeAttr('disabled');
				$referenceInput.removeAttr('disabled','disabled').parents('tr').show();
				$countriesSelect.attr('disabled','disabled');
				$acctInput.hide();
				$orderOption.removeAttr('disabled');
				$requiredToggleInputs.removeAttr('data-validation');
				$method.val('DoReferenceTransaction');
				if(status != 'disabled'){
					$acctInput.find('input').attr('disabled','disabled');;
				} else {
					$creditCard.find('input').attr('disabled','disabled');
				}	
			}
			recalculateModalWindowSize();
		});		
	}

	function initLoadMask() {
		loadMask = {
			ext: new Ext.LoadMask(Ext.getBody()),
			show: function(type) {
				this.ext.msg = paypalAdmin.resources.loadMaskText[type] || paypalAdmin.resources.pleaseWait;
				this.ext.show();
			},
			hide: function() {
				this.ext.hide();
			}
		};
	}
	
	function loadHelperAction(action, data, cb) {
		data = data || {};
		data.helperAction = action;
		$.ajax({
			url: paypalAdmin.urls.action,
			data: data,
			error: function(data) {
				window.location.reload();
			},
			success: function(response) {
				if(typeof cb === 'function') {
					cb(response);
				}
			}
		});
	}
	
	return {
		init : function(config) {
			$.extend(this, config);
			$(document).ready(function() {
				initEvents();
				initLoadMask();
				if($('.js_paypalbm_order_detail').size()) {
					initOrderTransaction();
				}
			});
		}
	}
})(jQuery);
