<?php
namespace App\Library\SslCommerz;

interface SslCommerzInterface
{
    public function makePayment(array $requestData, $type = 'checkout', $pattern = 'json');
    public function orderValidate($post_data, $trx_id = '', $amount = 0, $currency = 'BDT');
}
