Steadfast Courier Limited API Documentation
Base URL: https://portal.packzy.com/api/v1

🔐 API Authentication Parameters
All requests must include the following headers:

Name	Type	Description	Value
Api-Key	String	API Key provided by Steadfast Courier Ltd.	–
Secret-Key	String	Secret Key provided by Steadfast Courier Ltd.	–
Content-Type	String	Request Content Type	application/json
📦 Placing an Order
Path: /create_order
Method: POST

Input Parameters
Name	Type	MOC	Description	Example
invoice	string	required	Must be unique; alpha-numeric, hyphens, underscores allowed	12366, abc123, 12abchd, Aa12-das4, a_sdfd-wq
recipient_name	string	required	Within 100 characters	John Smith
recipient_phone	string	required	11-digit phone number	01234567890
alternative_phone	string	optional	11-digit phone number	–
recipient_email	string	optional	–	–
recipient_address	string	required	Recipient’s address within 250 characters	Fla# A1, House# 17/1, Road# 3/A, Dhanmondi, Dhaka-1209
cod_amount	numeric	required	Cash on delivery amount in BDT (≥0)	1060
note	string	optional	Delivery instructions or other notes	Deliver within 3 PM
item_description	string	optional	Items name and other information	–
total_lot	numeric	optional	Total lot of items	–
delivery_type	numeric	optional	0 = home delivery, 1 = Point Delivery/Steadfast Hub Pick Up	0 or 1
⚠️ Yellow‑marked parameters are newly added.

Sample Response
json
{
  "status": 200,
  "message": "Consignment has been created successfully.",
  "consignment": {
    "consignment_id": 1424107,
    "invoice": "Aa12-das4",
    "tracking_code": "15BAEB8A",
    "recipient_name": "John Smith",
    "recipient_phone": "01234567890",
    "recipient_address": "Fla# A1,House# 17/1, Road# 3/A, Dhanmondi,Dhaka-1209",
    "cod_amount": 1060,
    "status": "in_review",
    "note": "Deliver within 3PM",
    "created_at": "2021-03-21T07:05:31.000000Z",
    "updated_at": "2021-03-21T07:05:31.000000Z"
  }
}
📦 Bulk Order Create
Path: /create_order/bulk-order
Method: POST

Input Parameters
Name	Type	MOC	Description
data	Json	required	JSON‑encoded array of up to 500 orders
Array Keys
Each order item should follow this structure:

php
$item = [
    'invoice'       => '...',
    'recipient_name'=> '...',
    // ... other fields as in single order creation
];
Example Implementation (Laravel)
php
public function bulkCreate() {
    $orders = Order::with('address')->where('status',1)->take(500)->get();
    $data = array();
    foreach($orders as $order) {
        $item = [
            'invoice'          => $order->id,
            'recipient_name'   => $order->address ? $order->address->name : 'N/A',
            'recipient_address'=> $order->address ? $order->address->address : 'N/A',
            'recipient_phone'  => $order->address ? $order->address->phone : '',
            'cod_amount'       => $order->due_amount,
            'note'             => $order->note,
        ];
    }
    $steadfast = new Steadfast();
    $result = $steadfast->bulkCreate(json_encode($data));
    return $result;
}
API Call Example (Laravel HTTP Client)
php
public function bulkCreate($data) {
    $api_key    = 'your_api_key';
    $secret_key = 'your_secret_key';
    $response = Http::withHeaders([
        'Api-Key'     => $api_key,
        'Secret-Key'  => $secret_key,
        'Content-Type'=> 'application/json'
    ])->post($this->base_url.'/create_order/bulk-order', [
        'data' => $data,
    ]);
    return json_decode($response->getBody()->getContents());
}
Sample Success Response
json
[
  {
    "invoice": "230822-1",
    "recipient_name": "John Doe",
    "recipient_address": "House 44, Road 2/A, Dhanmondi, Dhaka 1209",
    "recipient_phone": "0171111111",
    "cod_amount": "0.00",
    "note": null,
    "consignment_id": 11543968,
    "tracking_code": "B025A038",
    "status": "success"
  },
  ...
]
Sample Error Response
json
{
  "data": [
    {
      "invoice": "230822-1",
      "recipient_name": "John Doe",
      "recipient_address": "House 44, Road 2/A, Dhanmondi, Dhaka 1209",
      "recipient_phone": "0171111111",
      "cod_amount": "0.00",
      "note": null,
      "consignment_id": null,
      "tracking_code": null,
      "status": "error"
    }
  ]
}
📍 Checking Delivery Status
By Consignment ID
Path: /status_by_cid/{id}
Method: GET

By Your Invoice ID
Path: /status_by_invoice/{invoice}
Method: GET

By Tracking Code
Path: /status_by_trackingcode/{trackingCode}
Method: GET

Sample Response
json
{
  "status": 200,
  "delivery_status": "in_review"
}
Delivery Statuses
Status	Description
pending	Consignment is not delivered or cancelled yet.
delivered_approval_pending	Consignment is delivered but waiting for admin approval.
partial_delivered_approval_pending	Consignment is delivered partially and waiting for admin approval.
cancelled_approval_pending	Consignment is cancelled and waiting for admin approval.
unknown_approval_pending	Unknown pending status. Contact support team.
delivered	Consignment is delivered and balance added.
partial_delivered	Consignment is partially delivered and balance added.
cancelled	Consignment is cancelled and balance updated.
hold	Consignment is held.
in_review	Order is placed and waiting to be reviewed.
unknown	Unknown status. Contact support team.
💰 Checking Current Balance
Path: /get_balance
Method: GET

Sample Response
json
{
  "status": 200,
  "current_balance": 0
}
🔁 Creating Return Requests
Path: /create_return_request
Method: POST

Name	Type	MOC	Description
consignment_id or invoice or tracking_code	Numeric or string	Required	Consignment ID, user‑defined invoice, or tracking code of the consignment to return.
reason	string	Optional	–
Sample Response
json
{
  "id": 1,
  "user_id": 1,
  "consignment_id": 10000042,
  "reason": null,
  "status": "pending",
  "created_at": "2025-07-30T23:11:45.000000Z",
  "updated_at": "2025-07-30T23:11:45.000000Z"
}
Status values: pending, approved, processing, completed, cancelled

📋 Single Return Request View
Path: /get_return_request/{id}
Method: GET

📋 Get Return Requests
Path: /get_return_requests
Method: GET

💳 Get Payments (Recently Added)
Path: /payments
Method: GET

💳 Get Single Payment with Consignments (Recently Added)
Path: /payments/{payment_id}
Method: GET

🚓 Get Police Stations (Recently Added)
Path: /police_stations
Method: GET