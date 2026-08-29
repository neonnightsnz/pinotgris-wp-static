const pluginManager = Vue.createApp({
  data() {
    return {
      companyName: 'Plugins for WP',
      companyEmail: 'support@pluginsforwp.com',
      myProductsRoute: '/wp-json/pluginsforwp/v1/my-products',
      detailsImage: 'https://pluginsforwp.com/wp-content/uploads/2020/07/new-tab-icon.png',
      purchaseUrl: 'https://pluginsforwp.com/checkout?edd_action=add_to_cart&download_id=DOWNLOAD_ID',
      unlimitedDownloadsId: 3591,
      pluginizer: false,
      activeTab: 'plugins',
      isBusy: false,
      isBusyMessage: null,

      settings: {
        key: null,
        username: null,
        coupon: null,
        affiliate: null,
      },

      products: [],
      pluginCnt: 0,
      themeCnt: 0,

      modals: {
        isProductListError: false,
        isInstallModalActive: false,
        isInstallOk: false,
        isInstallError: false,
        details: false,
        youtube: false,
      },

      product: {
        name: null,
        type: null,
      },

      user: {
        plugins: null,
        themes: null,
        serverUrl: null,
        hasAllAccess: false,
        hasUltimateItems: false,
        allAccessUrl: null,
        allAccessImage: null,
        validCredentials: false,
      },

      search: {
        plugins: {
          text: '',
        },
        themes: {
          text: '',
        },
      },

      filter: {
        plugins: 'all',
        themes: 'all',
      },

      pagination: {
        pluginPage: 1,
        themePage: 1,
        itemsPerPage: 10,
      },
    };
  },

  mounted() {
    if (this.companyName === 'Pluginizer') {
      this.pluginizer = true;
    }

    let params = new URLSearchParams(window.location.search);
    let searchParam = params.get('s');
    this.search.plugins.text = searchParam || '';

    this.getInstalledProducts();
  },

  computed: {
    allPlugins() {
      let plugins = [];
      for (const product of this.products) {
        if (product.type === 'plugin' &&
            this.canShowProduct(product, this.filter.plugins, this.search.plugins.text)) {
          plugins.push(product);
        }
      }

      return plugins;
    },

    getMaxPluginPages() {
      return Math.ceil(this.allPlugins.length / this.pagination.itemsPerPage);
    },

    plugins() {
      const start = (this.pagination.pluginPage - 1) * this.pagination.itemsPerPage;
      const end = this.pagination.pluginPage * this.pagination.itemsPerPage;

      return this.allPlugins.slice(start, end);
    },

    allThemes() {
      let themes = [];
      for (const product of this.products) {
        if (product.type === 'theme' &&
            this.canShowProduct(product, this.filter.themes, this.search.themes.text)) {
          themes.push(product);
        }
      }

      return themes;
    },

    getMaxThemePages() {
      return Math.ceil(this.allThemes.length / this.pagination.itemsPerPage);
    },

    themes() {
      const start = (this.pagination.themePage - 1) * this.pagination.itemsPerPage;
      const end = this.pagination.themePage * this.pagination.itemsPerPage;

      return this.allThemes.slice(start, end);
    },
  },

  methods: {
    setUsername(text) {
      this.settings.username = text.target.value;
    },

    setKey(text) {
      this.settings.key = text.target.value;
    },

    setAffiliate(text) {
      this.settings.affiliate = text.target.value;
    },

    getFilteredPluginCount() {
      let cnt = 0;
      for (let product of this.products) {
        if (product.type === 'plugin' &&
            product.name.toLowerCase().includes(this.search.plugins.text.toLowerCase())) {
          cnt++;
        }
      }

      return cnt;
    },

    getFilteredThemeCount() {
      let cnt = 0;
      for (let product of this.products) {
        if (product.type === 'theme' &&
            product.name.toLowerCase().includes(this.search.themes.text.toLowerCase())
        ) {
          cnt++;
        }
      }

      return cnt;
    },

    getBaseUrl() {
      let baseurl = window.location.origin + window.location.pathname;

      return baseurl.replace('/wp-admin/admin.php', '') + '/?rest_route=/pluginsforwp/v1';
    },

    getInstalledProducts() {
      this.isBusy = true;

      axios.get(this.getBaseUrl() + '/products/list', {headers: {'X-WP-Nonce': p4wSPA.nonce}}).then(response => {
        this.settings.username = response.data.username || null;
        this.settings.key = response.data.key || null;
        this.settings.affiliate = response.data.affiliate || null;

        this.user = {
          plugins: response.data.plugins,
          themes: response.data.themes,
          serverUrl: response.data.serverUrl,
        };

        this.isBusy = false;

        this.checkUpdates();
      });
    },

    /**
     * Install or update a product
     *
     * @param product
     */
    install(product) {
      this.product = product;
      this.modals.isInstallModalActive = true;
    },

    doInstall(product) {
      this.modals.isInstallModalActive = false;
      this.isBusy = true;
      this.isBusyMessage = 'Installing Product ...';

      axios.post(this.getBaseUrl() + '/products/install', product, {headers: {'X-WP-Nonce': p4wSPA.nonce}}).then(() => {
        this.modals.isInstallOk = true;
        this.isBusyMessage = null;

        this.getInstalledProducts();
      }).catch(() => {
        this.modals.isInstallError = true;
      });
    },

    /**
     * Update settings (Secret key)
     */
    submitSettings() {
      axios.post(this.getBaseUrl() + '/settings/save', this.settings, {headers: {'X-WP-Nonce': p4wSPA.nonce}}).then(() => {
        this.checkUpdates();
        this.activeTab = 'plugins';
      });
    },

    /**
     * Clear products
     */
    reset() {
      this.products = [];
      this.pluginCnt = 0;
      this.themeCnt = 0;
    },

    /**
     * Check for updated products by getting a list and comparing it with what's installed locally
     */
    checkUpdates() {
      this.reset();

      let request = {
        method: 'GET',
        url: this.user.serverUrl + this.myProductsRoute,
        headers: {
          'Content-type': 'application/json',
        },
      };

      this.user.validCredentials = false;
      if (this.settings.username && this.settings.key) {
        request.headers.Authorization = 'Basic ' + window.btoa(this.settings.username + ':' + this.settings.key);
      }

      this.isBusy = true;
      axios(request).then(response => {
        this.user.allAccessUrl = response.data.allAccessUrl;
        this.user.allAccessImage = response.data.allAccessImage;
        this.user.hasAllAccess = response.data.hasAllAccess;
        this.user.hasUltimateItems = response.data.hasUltimateItems;

        if (this.settings.username && this.settings.key) {
          this.user.validCredentials = true;
        }

        let userPlugins = Object.values(this.user.plugins);
        let userThemes = Object.values(this.user.themes);

        this.products = response.data.products;

        for (let product of this.products) {
          product.installedVersion = null;

          for (let plugin of userPlugins) {
            if (product.name === plugin.name && product.type === 'plugin') {
              product.installedVersion = plugin.installedVersion;
              product.active = plugin.active;
              product.installed = true;

              plugin.matched = true;
            }
          }

          for (let theme of userThemes) {
            if (product.name === theme.name && product.type === 'theme') {
              product.installedVersion = theme.installedVersion;
              product.active = theme.active;
              product.installed = true;

              theme.matched = true;
            }
          }

          if (product.type === 'plugin') {
            this.pluginCnt++;
          } else if (product.type === 'theme') {
            this.themeCnt++;
          }
        }

        userPlugins = userPlugins.filter(item => !item.matched);
        userThemes = userThemes.filter(item => !item.matched);

        this.products = this.products.concat(userPlugins).concat(userThemes);

        // Use a Set to track unique names
        let seenNames = new Set();

        // Filter the array to remove duplicates based on the `name` property
        this.products = this.products.filter(item => {
          if (seenNames.has(item.name)) {
            // If the name has already been seen, filter out this item
            return false;
          } else {
            // If it's a new name, add it to the Set and keep this item
            seenNames.add(item.name);
            return true;
          }
        });
        this.products.sort((a, b) => a.name.localeCompare(b.name));

        this.isBusy = false;
      }).catch(() => {
        this.modals.isProductListError = true;
      });
    },

    postError() {
      this.modals.isInstallError = false;
      this.checkUpdates();
    },

    /**
     * Filter the product by the radio buttons and search text
     * @param product
     * @param filter
     * @param text
     * @returns {boolean}
     */
    canShowProduct(product, filter, text) {
      if (filter === 'installed' && !product.installedVersion) {
        return false;
      }

      if (filter === 'purchased' && !product.purchased) {
        return false;
      }

      if (!text || (text && product.name.toLowerCase().includes(text.toLowerCase()))) {
        // filter by searchbox
        return true;
      }

      return false;
    },

    /**
     * Open an iframe to the main store site for product details and purchase
     * @param product
     */
    openDetailsModal(product) {
      this.modals.details = true;
      this.product = product;
    },

    /**
     * Replace the placeholders in the purchase URL with the download and pricing IDs given
     * @param url
     * @param downloadId
     * @returns {*}
     */
    replaceIds(url, downloadId) {
      return url.replace('DOWNLOAD_ID', downloadId);
    },

    /**
     * Add the coupon code to the purchase URL, if any
     * @returns {*}
     * @param downloadId
     * @param priceId
     */
    getPurchaseUrl(downloadId, priceId) {
      if (this.pluginizer) {
        let url = 'https://pluginizer.com/checkout?edd_action=add_to_cart&download_id=DOWNLOAD_ID';
        switch (priceId) {
          case -1:
            return this.replaceIds(url + '&discount=10off', 17483);
          case -2:
            return this.replaceIds(url + '&discount=50off', 18046);
          case -3:
            return this.replaceIds(url, 18049);
        }

        return 'https://pluginizer.com/pricing/';
      }

      let url = this.purchaseUrl;
      let newURL = url.split('?');

      switch (priceId) {
        case -1:
          downloadId = 484672;
          break;
        case -2:
          downloadId = 484675;
          break;
        case -3:
          downloadId = 484678;
          break;
      }

      // Regular products with coupon
      if (priceId > 0) {
        if (this.settings.coupon) {
          if (this.settings.affiliate) {
            return this.replaceIds(newURL[0] + '/?ref=' + this.settings.affiliate + '&' + newURL[1] + '&discount=' + this.settings.coupon, downloadId);
          } else {
            return this.replaceIds(url + '&discount=' + this.settings.coupon, downloadId);
          }
        }

        return this.replaceIds(url, downloadId);
      }

      // Unlimited downloads (hardcoded coupon)
      if (this.settings.affiliate) {
        return this.replaceIds(newURL[0] + '/?ref=' + this.settings.affiliate + '&' + newURL[1] + '&discount=INTRO50', downloadId);
      }

      return this.replaceIds(url + '&discount=INTRO50', downloadId);
    },

    /**
     * Activates a WordPress plugin
     * @param product
     */
    activatePlugin(product) {
      this.modals.isInstallOk = false;
      this.isBusyMessage = 'Activating ...';

      axios.post(this.getBaseUrl() + '/products/activate-plugin', product, {headers: {'X-WP-Nonce': p4wSPA.nonce}}).then(() => {
        window.location.reload();
      }).catch(() => {
        this.modals.isInstallError = true;
      });
    },

    /**
     * Deactivates a WordPress plugin
     * @param product
     */
    deactivatePlugin(product) {
      this.modals.isInstallOk = false;
      this.isBusyMessage = 'Deactivating ...';

      axios.post(this.getBaseUrl() + '/products/deactivate-plugin', product, {headers: {'X-WP-Nonce': p4wSPA.nonce}}).then(() => {
        window.location.reload();
      }).catch(() => {
        this.modals.isInstallError = true;
      });
    },

    /**
     * Activates a WordPress theme
     * @param product
     */
    activateTheme(product) {
      this.modals.isInstallOk = false;
      this.isBusyMessage = 'Activating ...';

      axios.post(this.getBaseUrl() + '/products/activate-theme', product, {headers: {'X-WP-Nonce': p4wSPA.nonce}}).then(() => {
        window.location.reload();
      }).catch(() => {
        this.modals.isInstallError = true;
      });
    },

    /**
     * Compare two versions without throwing
     * @param a
     * @param b
     * @returns {number|*}
     */
    compareProductVersions(a, b) {
      try {
        return compareVersions(a, b);
      } catch (e) {
        return 0;
      }
    },

    stripHTML(value) {
      let div = document.createElement('div');
      div.innerHTML = value;

      return div.textContent || div.innerText || '';
    },
  },
});

pluginManager.directive('readmore', {
  twoWay: true,
  bind: function (el, bind, vn) {
    let val_container = bind.value;

    if (bind.value.length > bind.arg) {
      vn.elm.textContent = bind.value.substring(0, bind.arg);
      let read_more = document.createElement('a');
      read_more.href = '#';
      read_more.text = '... [read more]';

      let read_less = document.createElement('a');
      read_less.href = '#';
      read_less.text = '[read less]';

      vn.elm.append(' ', read_more);

      read_more.addEventListener('click', function () {
        vn.elm.textContent = val_container;
        vn.elm.append(' ', read_less);
      });

      read_less.addEventListener('click', function () {
        vn.elm.textContent = bind.value.substring(0, bind.arg);
        vn.elm.append(' ', read_more);
      });
    } else {
      vn.elm.textContent = bind.value;
    }
  },
});

// Start the app
(function() {
  axios.defaults.withCredentials = true; // Send cookies when making AJAX requests

  pluginManager.use(Quasar); // Use Quasar UI library
  pluginManager.mount('#p4w-updater'); // Start the app

  // Add handler for close button on admin banner
  jQuery(document).ready(function ($) {
    $('#p4w-admin-banner .notice-dismiss').click(function () {
      axios.post('/?rest_route=/pluginsforwp/v1/settings/update-admin-banner-time', {}, {headers: {'X-WP-Nonce': p4wSPA.nonce}}).then(function () {});
    });
  });
})();
