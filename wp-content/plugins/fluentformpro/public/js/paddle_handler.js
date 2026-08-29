/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
/*!*********************************************!*\
  !*** ./src/assets/public/paddle_handler.js ***!
  \*********************************************/
jQuery(document).ready(function ($) {
  var $responseDom = $('body').find('.ff_paddle_payment_container');
  var $responseTitle = $('body').find('.ff_frameless_header');
  if (!$responseDom.length) {
    return;
  }
  var paddleVars = window.ff_paddle_vars;
  var frameInitialHeight = paddleVars.frame_initial_height || '450';
  var frameStyle = paddleVars.frame_style || 'width: 100%; min-width: 312px; background-color: transparent; border: none;';
  var allowedPaymentMethods = paddleVars.allowed_payment_methods || ['alipay', 'apple_pay', 'bancontact', 'card', 'google_pay', 'ideal', 'paypal'];
  var environment = paddleVars.payment_mode || 'sandbox';
  var theme = paddleVars.theme || 'light';
  var locale = paddleVars.locale || 'en';
  Paddle.Environment.set(environment);
  Paddle.Initialize({
    token: 'test_3bc9e24681cdd89478a439095d0',
    checkout: {
      settings: {
        displayMode: "inline",
        allowedPaymentMethods: allowedPaymentMethods,
        theme: theme,
        locale: locale,
        frameTarget: "ff_paddle_payment_container",
        frameInitialHeight: frameInitialHeight,
        frameStyle: frameStyle
      }
    },
    eventCallback: function eventCallback(res) {
      if (res.name == "checkout.completed") {
        var data = {
          action: 'fluentform_paddle_confirm_payment',
          transaction_hash: paddleVars.transaction_hash,
          submission_id: paddleVars.submission_id,
          paddle_payment: res.data
        };
        $.post(paddleVars.ajax_url, data).then(function (response) {
          if (response.data && response.data.payment.id == res.data.id) {
            $responseDom.find('p').text(response.data.success_message);
            $responseTitle.text(paddleVars.title_message);
          }
        })["catch"](function (errors) {
          var message = 'Request failed. Please try again';
          if (errors && errors.responseJSON) {
            message = errors.responseJSON.errors;
          }
          $responseDom.find('p').text(message);
        });
      }
      if (res.name == "checkout.error") {
        var message = 'Paddle payment process failed!';
        if (res.data && res.data.error) {
          message = res.data.error.detail;
        }
        $responseDom.find('p').text(message);
      }
    }
  });
});
/******/ })()
;