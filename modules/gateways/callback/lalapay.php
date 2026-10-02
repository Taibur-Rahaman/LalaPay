<?php
/** LalaPay WHMCS callback: provider/API status is authoritative; callback input is untrusted. */
require_once __DIR__ . '/../../../init.php';
require_once __DIR__ . '/../lalapay.php';
require_once ROOTDIR . '/includes/gatewayfunctions.php';
require_once ROOTDIR . '/includes/invoicefunctions.php';
$gatewayModule='lalapay';
$gatewayParams=getGatewayVariables($gatewayModule);
if(!$gatewayParams['type']){http_response_code(503);exit('LalaPay gateway is not active');}
$raw=file_get_contents('php://input');$input=json_decode($raw,true);if(!is_array($input))$input=$_POST;
$paymentId=isset($input['paymentId'])?trim((string)$input['paymentId']):'';if($paymentId===''){http_response_code(400);exit('Missing paymentId');}
$apiUrl=rtrim($gatewayParams['apiUrl'],'/');$apiKey=trim($gatewayParams['apiKey']);if($apiKey===''){http_response_code(503);exit('LalaPay API key is not configured');}
$result=lalapay_request($apiUrl.'/api/v1/integrations/whmcs/payment-status',$apiKey,array('paymentId'=>$paymentId),'POST');
if(!$result['ok']||!is_array($result['data'])){http_response_code(502);exit('Unable to verify payment');}
$data=$result['data'];$status=strtoupper((string)($data['status']??''));$invoiceId=(int)($data['invoiceId']??0);$amount=(float)($data['amount']??0);$currency=(string)($data['currency']??'');$transactionId=trim((string)($data['transactionId']??''));
if($invoiceId<=0||$amount<=0||$currency===''||$transactionId===''){http_response_code(422);exit('Invalid verified payment data');}
$invoice=localAPI('GetInvoice',array('invoiceid'=>$invoiceId));if(($invoice['result']??'')!=='success'){http_response_code(404);exit('Invoice not found');}
$expectedAmount=(float)$invoice['total'];$expectedCurrency=(string)$invoice['currency'];
if(abs($expectedAmount-$amount)>0.00001||strcasecmp($expectedCurrency,$currency)!==0){logTransaction($gatewayModule,array('paymentId'=>$paymentId,'invoiceId'=>$invoiceId,'status'=>$status,'reason'=>'Amount or currency mismatch'),'Payment mismatch');http_response_code(409);exit('Payment amount/currency mismatch');}
if($status==='SUCCEEDED'){
    // Idempotency at the WHMCS boundary: never add a second payment to an already-paid invoice.
    if(strtolower((string)($invoice['status']??''))!=='paid'){
        addInvoicePayment($invoiceId,$amount,$transactionId,0,$gatewayModule);
    }
    logTransaction($gatewayModule,$data,'Successful payment verified');
    header('Content-Type: application/json');echo json_encode(array('ok'=>true,'status'=>'SUCCEEDED','invoiceId'=>$invoiceId,'transactionId'=>$transactionId));exit;
}
logTransaction($gatewayModule,$data,'Payment status: '.$status);header('Content-Type: application/json');echo json_encode(array('ok'=>true,'status'=>$status));
