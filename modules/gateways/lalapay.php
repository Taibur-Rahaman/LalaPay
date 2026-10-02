<?php
/**
 * LalaPay WHMCS payment gateway.
 *
 * This module intentionally talks only to the LalaPay API. Provider secrets
 * for bKash/Nagad must remain on the LalaPay backend.
 */

if (!defined('WHMCS')) {
    die('This file cannot be accessed directly');
}

function lalapay_MetaData()
{
    return array(
        'DisplayName' => 'LalaPay',
        'APIVersion' => '1.1',
        'DisableLocalCredtCardInput' => true,
        'TokenisedStorage' => false,
    );
}

function lalapay_config()
{
    return array(
        'FriendlyName' => array(
            'Type' => 'System',
            'Value' => 'LalaPay',
        ),
        'apiUrl' => array(
            'FriendlyName' => 'LalaPay API URL',
            'Type' => 'text',
            'Size' => '60',
            'Default' => 'https://lalapay-api.vercel.app',
            'Description' => 'Use your deployed LalaPay API URL. Do not put bKash/Nagad secrets here.',
        ),
        'apiKey' => array(
            'FriendlyName' => 'LalaPay API Key',
            'Type' => 'password',
            'Size' => '60',
            'Description' => 'Server-to-server LalaPay integration key.',
        ),
    );
}

function lalapay_link($params)
{
    $apiUrl = rtrim($params['apiUrl'], '/');
    $apiKey = trim($params['apiKey']);

    if ($apiKey === '') {
        return '<div class="alert alert-danger">LalaPay API key is not configured.</div>';
    }

    $payload = array(
        'invoiceId' => (string) $params['invoiceid'],
        'amount' => (float) $params['amount'],
        'currency' => (string) $params['currency'],
        'customer' => array(
            'name' => trim($params['clientdetails']['firstname'] . ' ' . $params['clientdetails']['lastname']),
            'email' => $params['clientdetails']['email'],
            'phone' => $params['clientdetails']['phonenumber'],
        ),
        'returnUrl' => $params['systemurl'] . 'viewinvoice.php?id=' . rawurlencode($params['invoiceid']),
        'callbackUrl' => $params['systemurl'] . 'modules/gateways/callback/lalapay.php',
    );

    $response = lalapay_request($apiUrl . '/api/v1/integrations/whmcs/payments', $apiKey, $payload, 'POST');

    if (!$response['ok']) {
        return '<div class="alert alert-danger">Unable to initialize LalaPay payment. Please try again later.</div>';
    }

    $checkoutUrl = isset($response['data']['checkoutUrl']) ? $response['data']['checkoutUrl'] : '';
    if ($checkoutUrl === '' || !filter_var($checkoutUrl, FILTER_VALIDATE_URL)) {
        return '<div class="alert alert-danger">LalaPay returned an invalid checkout URL.</div>';
    }

    return '<a class="btn btn-primary" href="' . htmlspecialchars($checkoutUrl, ENT_QUOTES, 'UTF-8') . '">Pay with LalaPay</a>';
}

function lalapay_request($url, $apiKey, $payload, $method = 'POST')
{
    $ch = curl_init($url);
    curl_setopt_array($ch, array(
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => array(
            'Accept: application/json',
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey,
            'User-Agent: LalaPay-WHMCS/1.0',
        ),
        CURLOPT_POSTFIELDS => json_encode($payload),
    ));

    $body = curl_exec($ch);
    $error = curl_error($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($body === false || $error !== '') {
        return array('ok' => false, 'status' => $status, 'data' => null);
    }

    $data = json_decode($body, true);
    return array('ok' => $status >= 200 && $status < 300 && is_array($data), 'status' => $status, 'data' => $data);
}
