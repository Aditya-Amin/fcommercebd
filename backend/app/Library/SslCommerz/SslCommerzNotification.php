<?php
namespace App\Library\SslCommerz;

class SslCommerzNotification extends AbstractSslCommerz
{
    protected $data   = [];
    protected $config = [];

    private $successUrl;
    private $cancelUrl;
    private $failedUrl;
    private $ipnUrl;
    private $error;

    public function __construct()
    {
        $this->config = config('sslcommerz');
        $this->setStoreId($this->config['apiCredentials']['store_id']);
        $this->setStorePassword($this->config['apiCredentials']['store_password']);
    }

    public function orderValidate($post_data, $trx_id = '', $amount = 0, $currency = 'BDT')
    {
        if ($post_data == '' && $trx_id == '' && !is_array($post_data)) {
            $this->error = "Please provide valid transaction ID and post request data";
            return $this->error;
        }

        return $this->validate($trx_id, $amount, $currency, $post_data);
    }

    protected function validate($merchant_trans_id, $merchant_trans_amount, $merchant_trans_currency, $post_data)
    {
        if (!empty($merchant_trans_id) && !empty($merchant_trans_amount)) {

            $post_data['store_id']   = $this->getStoreId();
            $post_data['store_pass'] = $this->getStorePassword();

            $val_id       = urlencode($post_data['val_id']);
            $store_id     = urlencode($this->getStoreId());
            $store_passwd = urlencode($this->getStorePassword());
            $requested_url = $this->config['apiDomain']
                . $this->config['apiUrl']['order_validate']
                . "?val_id={$val_id}&store_id={$store_id}&store_passwd={$store_passwd}&v=1&format=json";

            $handle = curl_init();
            curl_setopt($handle, CURLOPT_URL, $requested_url);
            curl_setopt($handle, CURLOPT_RETURNTRANSFER, true);

            if ($this->config['connect_from_localhost']) {
                curl_setopt($handle, CURLOPT_SSL_VERIFYHOST, 0);
                curl_setopt($handle, CURLOPT_SSL_VERIFYPEER, 0);
            } else {
                curl_setopt($handle, CURLOPT_SSL_VERIFYHOST, 2);
                curl_setopt($handle, CURLOPT_SSL_VERIFYPEER, 2);
            }

            $result = curl_exec($handle);
            $code   = curl_getinfo($handle, CURLINFO_HTTP_CODE);

            if ($code == 200 && !(curl_errno($handle))) {
                $result = json_decode($result);
                $this->sslc_data = $result;

                $status          = $result->status;
                $tran_id         = $result->tran_id;
                $val_id          = $result->val_id;
                $amount          = $result->amount;
                $currency_type   = $result->currency_type;
                $currency_amount = $result->currency_amount;

                if ($status == "VALID" || $status == "VALIDATED") {
                    if ($merchant_trans_currency == "BDT") {
                        if (trim($merchant_trans_id) == trim($tran_id) && (abs($merchant_trans_amount - $amount) < 1) && trim($merchant_trans_currency) == trim('BDT')) {
                            return true;
                        }
                        $this->error = "Data has been tampered";
                        return false;
                    }

                    if (trim($merchant_trans_id) == trim($tran_id) && (abs($merchant_trans_amount - $currency_amount) < 1) && trim($merchant_trans_currency) == trim($currency_type)) {
                        return true;
                    }
                    $this->error = "Data has been tampered";
                    return false;
                }

                $this->error = "Failed Transaction";
                return false;
            }

            $this->error = "Failed to connect with SSLCOMMERZ";
            return false;
        }

        $this->error = "Invalid data";
        return false;
    }

    protected function SSLCOMMERZ_hash_verify($post_data, $store_passwd = "")
    {
        if (isset($post_data['verify_sign']) && isset($post_data['verify_key'])) {
            $pre_define_key = explode(',', $post_data['verify_key']);
            $new_data       = [];

            foreach ($pre_define_key as $value) {
                $new_data[$value] = $post_data[$value];
            }

            $new_data['store_passwd'] = md5($store_passwd);
            ksort($new_data);

            $hash_string = "";
            foreach ($new_data as $key => $value) {
                $hash_string .= $key . '=' . $value . '&';
            }
            $hash_string = rtrim($hash_string, '&');

            if (md5($hash_string) == $post_data['verify_sign']) {
                return true;
            }

            $this->error = "Verification signature not matched";
            return false;
        }

        $this->error = 'Required data missing: verify_key, verify_sign';
        return false;
    }

    public function makePayment(array $requestData, $type = 'checkout', $pattern = 'json')
    {
        if (empty($requestData)) {
            return "Please provide valid transaction data";
        }

        $this->setApiUrl($this->config['apiDomain'] . $this->config['apiUrl']['make_payment']);
        $this->setParams($requestData);
        $this->setAuthenticationInfo();

        $response          = $this->callToApi($this->data, [], $this->config['connect_from_localhost']);
        $formattedResponse = $this->formatResponse($response, $type, $pattern);

        if ($type == 'hosted') {
            if (!empty($formattedResponse['GatewayPageURL'])) {
                $this->redirect($formattedResponse['GatewayPageURL']);
            } else {
                $message = isset($formattedResponse['failedreason']) && strpos($formattedResponse['failedreason'], 'Store Credential') === false
                    ? $formattedResponse['failedreason']
                    : "Check SSLCZ_TESTMODE and SSLCZ_STORE_PASSWORD in .env";
                return $message;
            }
        }

        return $formattedResponse;
    }

    protected function setSuccessUrl()
    {
        $this->successUrl = rtrim(env('APP_URL'), '/') . $this->config['success_url'];
    }

    protected function getSuccessUrl()   { return $this->successUrl; }

    protected function setFailedUrl()
    {
        $this->failedUrl = rtrim(env('APP_URL'), '/') . $this->config['failed_url'];
    }

    protected function getFailedUrl()    { return $this->failedUrl; }

    protected function setCancelUrl()
    {
        $this->cancelUrl = rtrim(env('APP_URL'), '/') . $this->config['cancel_url'];
    }

    protected function getCancelUrl()    { return $this->cancelUrl; }

    protected function setIPNUrl()
    {
        $this->ipnUrl = rtrim(env('APP_URL'), '/') . $this->config['ipn_url'];
    }

    protected function getIPNUrl()       { return $this->ipnUrl; }

    public function setParams($requestData)
    {
        $this->setRequiredInfo($requestData);
        $this->setCustomerInfo($requestData);
        $this->setShipmentInfo($requestData);
        $this->setProductInfo($requestData);
        $this->setAdditionalInfo($requestData);
    }

    public function setAuthenticationInfo()
    {
        $this->data['store_id']     = $this->getStoreId();
        $this->data['store_passwd'] = $this->getStorePassword();
        return $this->data;
    }

    public function setRequiredInfo(array $info)
    {
        $this->data['total_amount']    = $info['total_amount'];
        $this->data['currency']        = $info['currency'];
        $this->data['tran_id']         = $info['tran_id'];
        $this->data['product_category']= $info['product_category'];

        $this->setSuccessUrl();
        $this->setFailedUrl();
        $this->setCancelUrl();
        $this->setIPNUrl();

        $this->data['success_url'] = $this->getSuccessUrl();
        $this->data['fail_url']    = $this->getFailedUrl();
        $this->data['cancel_url']  = $this->getCancelUrl();
        $this->data['ipn_url']     = $this->getIPNUrl();

        $this->data['multi_card_name']   = $info['multi_card_name']   ?? null;
        $this->data['allowed_bin']       = $info['allowed_bin']       ?? null;
        $this->data['emi_option']        = $info['emi_option']        ?? null;
        $this->data['emi_max_inst_option']= $info['emi_max_inst_option'] ?? null;
        $this->data['emi_selected_inst'] = $info['emi_selected_inst'] ?? null;
        $this->data['emi_allow_only']    = $info['emi_allow_only']    ?? 0;

        return $this->data;
    }

    public function setCustomerInfo(array $info)
    {
        $this->data['cus_name']     = $info['cus_name']     ?? null;
        $this->data['cus_email']    = $info['cus_email']    ?? null;
        $this->data['cus_add1']     = $info['cus_add1']     ?? null;
        $this->data['cus_add2']     = $info['cus_add2']     ?? null;
        $this->data['cus_city']     = $info['cus_city']     ?? null;
        $this->data['cus_state']    = $info['cus_state']    ?? null;
        $this->data['cus_postcode'] = $info['cus_postcode'] ?? null;
        $this->data['cus_country']  = $info['cus_country']  ?? 'Bangladesh';
        $this->data['cus_phone']    = $info['cus_phone']    ?? null;
        $this->data['cus_fax']      = $info['cus_fax']      ?? null;
        return $this->data;
    }

    public function setShipmentInfo(array $info)
    {
        $this->data['shipping_method'] = $info['shipping_method'] ?? 'NO';
        $this->data['num_of_item']     = $info['num_of_item']     ?? 1;
        $this->data['ship_name']       = $info['ship_name']       ?? null;
        $this->data['ship_add1']       = $info['ship_add1']       ?? null;
        $this->data['ship_add2']       = $info['ship_add2']       ?? null;
        $this->data['ship_city']       = $info['ship_city']       ?? null;
        $this->data['ship_state']      = $info['ship_state']      ?? null;
        $this->data['ship_postcode']   = $info['ship_postcode']   ?? null;
        $this->data['ship_country']    = $info['ship_country']    ?? null;
        return $this->data;
    }

    public function setProductInfo(array $info)
    {
        $this->data['product_name']     = $info['product_name']     ?? '';
        $this->data['product_category'] = $info['product_category'] ?? '';
        $this->data['product_profile']  = $info['product_profile']  ?? 'non-physical-goods';
        $this->data['cart']             = $info['cart']             ?? null;
        $this->data['product_amount']   = $info['product_amount']   ?? null;
        $this->data['vat']              = $info['vat']              ?? null;
        $this->data['discount_amount']  = $info['discount_amount']  ?? null;
        $this->data['convenience_fee']  = $info['convenience_fee']  ?? null;
        return $this->data;
    }

    public function setAdditionalInfo(array $info)
    {
        $this->data['value_a'] = $info['value_a'] ?? null;
        $this->data['value_b'] = $info['value_b'] ?? null;
        $this->data['value_c'] = $info['value_c'] ?? null;
        $this->data['value_d'] = $info['value_d'] ?? null;
        return $this->data;
    }
}
