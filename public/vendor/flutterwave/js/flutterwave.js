/**
 * Flutterwave Laravel Integration JavaScript
 * 
 * This script helps with integrating Flutterwave inline checkout
 * into your Laravel application.
 */

class FlutterwavePayment {
    /**
     * Initialize the FlutterwavePayment class
     * 
     * @param {string} publicKey - Flutterwave public key
     * @param {object} options - Optional configuration
     */
    constructor(publicKey, options = {}) {
        this.publicKey = publicKey;
        this.modalType = options.modalType || 'popup'; // 'popup' or 'standard'
        this.callbackUrl = options.callbackUrl || null;
        this.onClose = options.onClose || function() {};
        this.onSuccess = options.onSuccess || function() {};
    }

    /**
     * Initialize payment
     * 
     * @param {object} paymentData - Payment information
     */
    makePayment(paymentData) {
        // Make sure FlutterwaveCheckout is available
        if (typeof FlutterwaveCheckout !== 'function') {
            console.error('FlutterwaveCheckout not found. Make sure you include the Flutterwave v3 script.');
            return;
        }

        // Prepare configuration
        const config = {
            public_key: this.publicKey,
            tx_ref: paymentData.tx_ref || this.generateTransactionReference(),
            amount: paymentData.amount,
            currency: paymentData.currency || 'NGN',
            payment_options: paymentData.payment_options || 'card,banktransfer,ussd',
            redirect_url: paymentData.redirect_url || this.callbackUrl,
            customer: {
                email: paymentData.email,
                name: paymentData.name,
                phone_number: paymentData.phone || '',
            },
            customizations: {
                title: paymentData.title || document.title,
                description: paymentData.description || 'Payment for products/services',
                logo: paymentData.logo || '',
            },
            onclose: this.onClose,
            callback: this.onSuccess,
        };

        if (this.modalType === 'standard') {
            // For standard modal
            FlutterwaveCheckout(config);
        } else {
            // For popup modal
            config.hosted_payment = true;
            FlutterwaveCheckout(config);
        }

        return config.tx_ref;
    }

    /**
     * Generate a unique transaction reference
     * 
     * @return {string} Transaction reference
     */
    generateTransactionReference() {
        const date = new Date();
        return 'FLW-' + date.getTime() + '-' + Math.floor(Math.random() * 1000000);
    }

    /**
     * Initialize a payment via AJAX
     * 
     * @param {object} paymentData - Payment information
     * @param {string} initUrl - URL to initialize payment
     * @param {function} successCallback - Callback on success
     * @param {function} errorCallback - Callback on error
     */
    initializeViaAjax(paymentData, initUrl, successCallback, errorCallback) {
        // Get CSRF token from meta tag
        const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

        fetch(initUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': token,
                'Accept': 'application/json',
            },
            body: JSON.stringify(paymentData),
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                // If direct redirect URL is provided
                if (data.data.link) {
                    window.location.href = data.data.link;
                } else {
                    // Otherwise use inline checkout
                    this.makePayment({
                        ...paymentData,
                        tx_ref: data.data.tx_ref,
                    });
                }
                
                if (typeof successCallback === 'function') {
                    successCallback(data);
                }
            } else {
                if (typeof errorCallback === 'function') {
                    errorCallback(data);
                }
            }
        })
        .catch(error => {
            console.error('Flutterwave initialization error:', error);
            
            if (typeof errorCallback === 'function') {
                errorCallback({ status: 'error', message: 'Failed to initialize payment' });
            }
        });
    }
}

// Export for module usage
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = FlutterwavePayment;
}