function p4wAddPluginButton() {
    var buttonHtml = '<div style="clear: both; text-align: right;">Install from: <a href="/wp-admin/admin.php?page=pluginsforwp-plugin-manager/pluginsforwp-plugin-manager.vue" class="button button-primary p4w-plugin-button">Plugins for WP</a></div>';
    jQuery('.action-links').append(buttonHtml);

    jQuery('.p4w-plugin-button').each(function () {
        var linkText = jQuery(this).closest('div.action-links').prev('.name').find('h3 a').text().split('–')[0].trim();
        var threeWords = linkText.split(" ").slice(0, 3).join(" ");
        jQuery(this).attr('href', '/wp-admin/admin.php?page=pluginsforwp-plugin-manager/pluginsforwp-plugin-manager.vue&s=' + encodeURIComponent(threeWords));
    });
}

jQuery(document).ready(p4wAddPluginButton);

// Add event to fire once on the first ajax after the user searches to add the buttons
jQuery('#search-plugins').change(function (event) {
    jQuery(document).one('ajaxComplete', p4wAddPluginButton);
});

// Add event to fire once when changing the type dropdown
jQuery('#typeselector').change(function () {
    jQuery(document).one('ajaxComplete', p4wAddPluginButton);
});
