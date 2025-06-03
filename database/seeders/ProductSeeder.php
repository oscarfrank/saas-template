<?php

namespace Database\Seeders;

use Modules\Product\Models\Product;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear the table first
        Product::truncate();

        $products = [
            [
                'name' => "Smart Fitness Watch",
                'description' => "Track your fitness goals with this advanced smartwatch featuring heart rate monitoring and GPS",
                'price' => 199.99,
                'featured_image' => "images/products/smart-fitness-watch-681587dd9d631.jpg",
                'featured_image_original_name' => "smart-fitness-watch-681587dd9d631.jpg",
                'tenant_id' => "oscarmini",
            ],
            [
                'name' => "Professional Camera Kit",
                'description' => "Complete DSLR camera kit with 18-55mm lens, tripod, and carrying case",
                'price' => 899.99,
                'featured_image' => "images/products/professional-camera-kit-681587de494d3.jpg",
                'featured_image_original_name' => "professional-camera-kit-681587de494d3.jpg",
                'tenant_id' => "oscarmini",
            ],
            [
                'name' => "Ergonomic Office Chair",
                'description' => "Comfortable and supportive office chair with adjustable height and lumbar support",
                'price' => 249.99,
                'featured_image' => "images/products/ergonomic-office-chair-681587dee0234.jpg",
                'featured_image_original_name' => "ergonomic-office-chair-681587dee0234.jpg",
                'tenant_id' => "oscarmini",
            ],
            [
                'name' => "Mechanical Gaming Keyboard",
                'description' => "RGB backlit mechanical keyboard with programmable keys",
                'price' => 89.99,
                'featured_image' => "images/products/mechanical-gaming-keyboard-681587df951a1.jpg",
                'featured_image_original_name' => "mechanical-gaming-keyboard-681587df951a1.jpg",
                'tenant_id' => "oscarmini",
            ],
            [
                'name' => "4K Ultra HD Monitor",
                'description' => "27-inch 4K monitor with HDR support and USB-C connectivity",
                'price' => 399.99,
                'featured_image' => "images/products/4k-ultra-hd-monitor-681587e05809d.jpg",
                'featured_image_original_name' => "4k-ultra-hd-monitor-681587e05809d.jpg",
                'tenant_id' => "oscarmini",
            ],
            [
                'name' => "Wireless Charging Pad",
                'description' => "Fast wireless charging pad compatible with all Qi-enabled devices",
                'price' => 49.99,
                'featured_image' => "images/products/wireless-charging-pad-681587e0e6970.jpg",
                'featured_image_original_name' => "wireless-charging-pad-681587e0e6970.jpg",
                'tenant_id' => "oscarmini",
            ],
            [
                'name' => "Smart Home Security Camera",
                'description' => "1080p security camera with night vision and motion detection",
                'price' => 79.99,
                'featured_image' => "images/products/smart-home-security-camera-681587e25349b.jpg",
                'featured_image_original_name' => "smart-home-security-camera-681587e25349b.jpg",
                'tenant_id' => "oscarmini",
            ],
            [
                'name' => "Gaming Mouse",
                'description' => "High-precision gaming mouse with customizable DPI settings",
                'price' => 59.99,
                'featured_image' => "images/products/gaming-mouse-681587e35b86d.jpg",
                'featured_image_original_name' => "gaming-mouse-681587e35b86d.jpg",
                'tenant_id' => "oscarmini",
            ],
            [
                'name' => "External SSD Drive",
                'description' => "1TB external SSD with USB 3.2 Gen 2 support",
                'price' => 149.99,
                'featured_image' => "images/products/external-ssd-drive-681587e40bf18.jpg",
                'featured_image_original_name' => "external-ssd-drive-681587e40bf18.jpg",
                'tenant_id' => "oscarmini",
            ],
            [
                'name' => "Smart LED Light Bulbs",
                'description' => "Set of 4 color-changing smart bulbs with app control",
                'price' => 69.99,
                'featured_image' => "images/products/smart-led-light-bulbs-681587e48f47f.jpg",
                'featured_image_original_name' => "smart-led-light-bulbs-681587e48f47f.jpg",
                'tenant_id' => "oscarmini",
            ],
            [
                'name' => "Laptop Stand",
                'description' => "Adjustable aluminum laptop stand for better ergonomics",
                'price' => 39.99,
                'featured_image' => "images/products/laptop-stand-681587e52cd30.jpg",
                'featured_image_original_name' => "laptop-stand-681587e52cd30.jpg",
                'tenant_id' => "oscarmini",
            ],
            [
                'name' => "Noise Cancelling Earbuds",
                'description' => "True wireless earbuds with active noise cancellation",
                'price' => 179.99,
                'featured_image' => "images/products/noise-cancelling-earbuds-681587e5c4bfe.jpg",
                'featured_image_original_name' => "noise-cancelling-earbuds-681587e5c4bfe.jpg",
                'tenant_id' => "oscarmini",
            ],
            [
                'name' => "Smart Door Lock",
                'description' => "Keyless entry smart lock with fingerprint and app control",
                'price' => 199.99,
                'featured_image' => "images/products/smart-door-lock-681587e6d0940.jpg",
                'featured_image_original_name' => "smart-door-lock-681587e6d0940.jpg",
                'tenant_id' => "oscarmini",
            ],
            [
                'name' => "Portable Power Bank",
                'description' => "20000mAh power bank with fast charging support",
                'price' => 49.99,
                'featured_image' => "images/products/portable-power-bank-681587e772413.jpg",
                'featured_image_original_name' => "portable-power-bank-681587e772413.jpg",
                'tenant_id' => "oscarmini",
            ],
            [
                'name' => "Wireless Gaming Controller",
                'description' => "Ergonomic controller with customizable buttons",
                'price' => 69.99,
                'featured_image' => "images/products/wireless-gaming-controller-681587e94801e.jpg",
                'featured_image_original_name' => "wireless-gaming-controller-681587e94801e.jpg",
                'tenant_id' => "oscarmini",
            ],
            [
                'name' => "USB-C Hub",
                'description' => "7-in-1 USB-C hub with HDMI, USB-A, and SD card slots",
                'price' => 59.99,
                'featured_image' => "images/products/usb-c-hub-681587eaeb585.jpg",
                'featured_image_original_name' => "usb-c-hub-681587eaeb585.jpg",
                'tenant_id' => "oscarmini",
            ],
            [
                'name' => "Smart Doorbell",
                'description' => "Video doorbell with motion detection and two-way audio",
                'price' => 149.99,
                'featured_image' => "images/products/smart-doorbell-681587eb78ac5.jpg",
                'featured_image_original_name' => "smart-doorbell-681587eb78ac5.jpg",
                'tenant_id' => "oscarmini",
            ],
            [
                'name' => "Wireless Charging Stand",
                'description' => "Adjustable wireless charging stand for phones and watches",
                'price' => 39.99,
                'featured_image' => "images/products/wireless-charging-stand-681587ec05e19.jpg",
                'featured_image_original_name' => "wireless-charging-stand-681587ec05e19.jpg",
                'tenant_id' => "oscarmini",
            ],
            [
                'name' => "Bluetooth Car Kit",
                'description' => "Hands-free car kit with noise cancellation",
                'price' => 49.99,
                'featured_image' => "images/products/bluetooth-car-kit-681587ed1299c.jpg",
                'featured_image_original_name' => "bluetooth-car-kit-681587ed1299c.jpg",
                'tenant_id' => "oscarmini",
            ],
        ];

        foreach ($products as $product) {
            Product::create($product);
        }
    }
}
