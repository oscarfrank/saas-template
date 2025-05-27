<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ config('app.name') }} - Payment Failed</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        body {
            background-color: #f8f9fa;
            padding: 20px;
        }
        .failed-container {
            max-width: 600px;
            margin: 50px auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            padding: 30px;
            text-align: center;
        }
        .failed-icon {
            font-size: 80px;
            color: #dc3545;
            margin-bottom: 20px;
        }
        .transaction-info {
            background-color: #f8f9fa;
            border-radius: 5px;
            padding: 15px;
            margin-top: 20px;
            text-align: left;
        }
        .btn-retry {
            margin-top: 20px;
            margin-right: 10px;
        }
        .btn-back {
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="failed-container">
            <div class="failed-icon">
                <i class="fas fa-times-circle"></i>
            </div>
            
            <h2>Payment Failed</h2>
            <p class="lead">We couldn't process your payment.</p>
            
            @if(!empty($error))
                <div class="alert alert-danger">
                    {{ $error }}
                </div>
            @endif
            
            <div class="transaction-info">
                <div class="row mb-2">
                    <div class="col-6 text-muted">Transaction Reference:</div>
                    <div class="col-6">{{ $tx_ref ?? 'N/A' }}</div>
                </div>
                
                <div class="row mb-2">
                    <div class="col-6 text-muted">Status:</div>
                    <div class="col-6">{{ ucfirst($status ?? 'failed') }}</div>
                </div>
                
                <div class="row mb-2">
                    <div class="col-6 text-muted">Date:</div>
                    <div class="col-6">{{ now()->format('d M Y, h:i A') }}</div>
                </div>
            </div>
            
            <div>
                <a href="{{ route('flutterwave.payment.form') }}" class="btn btn-primary btn-retry">
                    Try Again
                </a>
                
                <a href="{{ url('/') }}" class="btn btn-secondary btn-back">
                    Back to Home
                </a>
            </div>
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>