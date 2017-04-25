$('body').on('click', '#closeChat', () => {
  $('#closeChat').hide();
  $('#openChat').show();
  $('.chat-content').slideUp();
});
$('body').on('click', '#openChat', () => {
  $('#openChat').hide();
  $('#closeChat').show();
  $('.chat-content').slideDown();
});

$(window).ready(() => {
  // Initialize emoji
  setTimeout(() => {
    $('#chatInput').emojioneArea({
      pickerPosition: 'top',
      filtersPosition: 'top',
      tones: false,
      autocomplete: false,
      inline: true,
      hidePickerOnBlur: true
    });
  }, 300);
});
