<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $ui['title'] ?? config('app.name') . ' Payment' }}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body {
            background-color: #f8f9fa;
            padding: 20px;
        }
        .payment-container {
            max-width: 600px;
            margin: 50px auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            padding: 30px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        .btn-primary {
            background-color: #0d6efd;
            border: none;
            padding: 10px 20px;
            width: 100%;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo-container {
            text-align: center;
            margin-bottom: 20px;
        }
        .logo {
            max-height: 80px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="payment-container">
            @if(!empty($ui['logo']))
            <div class="logo-container">
                <img src="{{ $ui['logo'] }}" alt="Logo" class="logo">
            </div>
            @endif
            
            <div class="header">
                <h2>{{ $ui['title'] ?? config('app.name') . ' Payment' }}</h2>
                <p>{{ $ui['description'] ?? 'Complete your payment securely' }}</p>
            </div>
            
            <form id="payment-form">
                @csrf
                <div class="form-group">
                    <label for="name">Full Name</label>
                    <input type="text" class="form-control" id="name" name="name" required>
                </div>
                
                <div class="form-group">
                    <label for="email">Email Address</label>
                    <input type="email" class="form-control" id="email" name="email" required>
                </div>
                
                <div class="form-group">
                    <label for="phone">Phone Number</label>
                    <input type="text" class="form-control" id="phone" name="phone">
                </div>
                
                <div class="form-group">
                    <label for="amount">Amount</label>
                    <div class="input-group">
                        <span class="input-group-text">{{ config('flutterwave.currency', 'NGN') }}</span>
                        <input type="number" class="form-control" id="amount" name="amount" min="1" step="0.01" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <button type="submit" class="btn btn-primary btn-lg">Pay Now</button>
                </div>
            </form>
            
            <div class="text-center mt-3">
                <small class="text-muted">Secured by Flutterwave</small>
            </div>
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://checkout.flutterwave.com/v3.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const form = document.getElementById('payment-form');
            
            form.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const formData = {
                    name: document.getElementById('name').value,
                    email: document.getElementById('email').value,
                    phone: document.getElementById('phone').value,
                    amount: document.getElementById('amount').value,
                    currency: '{{ config('flutterwave.currency', 'NGN') }}',
                    _token: document.querySelector('input[name="_token"]').value
                };
                
                try {
                    const response = await fetch('{{ route('flutterwave.payment.initialize') }}', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': formData._token
                        },
                        body: JSON.stringify(formData)
                    });
                    
                    const data = await response.json();
                    
                    if (data.status === 'success') {
                        window.location.href = data.data.link;
                    } else {
                        alert('Payment initialization failed: ' + data.message);
                    }
                } catch (error) {
                    alert('Error: Could not initialize payment');
                    console.error('Payment error:', error);
                }
            });
        });
    </script>
</body>
</html>