document.querySelectorAll('.forter-abusepolicysettings-select').forEach(function (element) {
    element.addEventListener('change', function () {
        var selectedValue = this.value;
        var selectionType = this.classList[1];
        var errorMessageBlock = document.querySelector('.forter-abusepolicysettings-error-message.' + selectionType).parentElement;

        if (selectedValue === '1') {
            errorMessageBlock.classList.add('hide');
        } else {
            errorMessageBlock.classList.remove('hide');
        }
    });
});
