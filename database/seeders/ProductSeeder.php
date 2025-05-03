<?php

namespace Database\Seeders;

use App\Models\Product;
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
                'featured_image' => "images/products/smartwatch.jpg",
                'featured_image_original_name' => "smartwatch.jpg",
            ],
            [
                'name' => "Professional Camera Kit",
                'description' => "Complete DSLR camera kit with 18-55mm lens, tripod, and carrying case",
                'price' => 899.99,
                'featured_image' => "images/products/camera.jpg",
                'featured_image_original_name' => "camera.jpg",
            ],
            [
                'name' => "Ergonomic Office Chair",
                'description' => "Comfortable and supportive office chair with adjustable height and lumbar support",
                'price' => 249.99,
                'featured_image' => "images/products/chair.jpg",
                'featured_image_original_name' => "chair.jpg",
            ],
            [
                'name' => "Mechanical Gaming Keyboard",
                'description' => "RGB backlit mechanical keyboard with programmable keys",
                'price' => 89.99,
                'featured_image' => "images/products/keyboard.jpg",
                'featured_image_original_name' => "keyboard.jpg",
            ],
            [
                'name' => "4K Ultra HD Monitor",
                'description' => "27-inch 4K monitor with HDR support and USB-C connectivity",
                'price' => 399.99,
                'featured_image' => "images/products/monitor.jpg",
                'featured_image_original_name' => "monitor.jpg",
            ],
            [
                'name' => "Wireless Charging Pad",
                'description' => "Fast wireless charging pad compatible with all Qi-enabled devices",
                'price' => 49.99,
                'featured_image' => "images/products/charger.jpg",
                'featured_image_original_name' => "charger.jpg",
            ],
            [
                'name' => "Smart Home Security Camera",
                'description' => "1080p security camera with night vision and motion detection",
                'price' => 79.99,
                'featured_image' => "images/products/security-camera.jpg",
                'featured_image_original_name' => "security-camera.jpg",
            ],
            [
                'name' => "Gaming Mouse",
                'description' => "High-precision gaming mouse with customizable DPI settings",
                'price' => 59.99,
                'featured_image' => "images/products/mouse.jpg",
                'featured_image_original_name' => "mouse.jpg",
            ],
            [
                'name' => "External SSD Drive",
                'description' => "1TB external SSD with USB 3.2 Gen 2 support",
                'price' => 149.99,
                'featured_image' => "images/products/ssd.jpg",
                'featured_image_original_name' => "ssd.jpg",
            ],
            [
                'name' => "Smart LED Light Bulbs",
                'description' => "Set of 4 color-changing smart bulbs with app control",
                'price' => 69.99,
                'featured_image' => "images/products/bulbs.jpg",
                'featured_image_original_name' => "bulbs.jpg",
            ],
            [
                'name' => "Laptop Stand",
                'description' => "Adjustable aluminum laptop stand for better ergonomics",
                'price' => 39.99,
                'featured_image' => "images/products/stand.jpg",
                'featured_image_original_name' => "stand.jpg",
            ],
            [
                'name' => "Noise Cancelling Earbuds",
                'description' => "True wireless earbuds with active noise cancellation",
                'price' => 179.99,
                'featured_image' => "images/products/earbuds.jpg",
                'featured_image_original_name' => "earbuds.jpg",
            ],
            [
                'name' => "Smart Door Lock",
                'description' => "Keyless entry smart lock with fingerprint and app control",
                'price' => 199.99,
                'featured_image' => "images/products/lock.jpg",
                'featured_image_original_name' => "lock.jpg",
            ],
            [
                'name' => "Portable Power Bank",
                'description' => "20000mAh power bank with fast charging support",
                'price' => 49.99,
                'featured_image' => "images/products/powerbank.jpg",
                'featured_image_original_name' => "powerbank.jpg",
            ],
            [
                'name' => "Smart Thermostat",
                'description' => "WiFi-enabled thermostat with learning capabilities",
                'price' => 129.99,
                'featured_image' => "images/products/thermostat.jpg",
                'featured_image_original_name' => "thermostat.jpg",
            ],
            [
                'name' => "Wireless Gaming Controller",
                'description' => "Ergonomic controller with customizable buttons",
                'price' => 69.99,
                'featured_image' => "images/products/controller.jpg",
                'featured_image_original_name' => "controller.jpg",
            ],
            [
                'name' => "Smart Scale",
                'description' => "Digital scale with body composition analysis",
                'price' => 89.99,
                'featured_image' => "images/products/scale.jpg",
                'featured_image_original_name' => "scale.jpg",
            ],
            [
                'name' => "USB-C Hub",
                'description' => "7-in-1 USB-C hub with HDMI, USB-A, and SD card slots",
                'price' => 59.99,
                'featured_image' => "images/products/hub.jpg",
                'featured_image_original_name' => "hub.jpg",
            ],
            [
                'name' => "Smart Doorbell",
                'description' => "Video doorbell with motion detection and two-way audio",
                'price' => 149.99,
                'featured_image' => "images/products/doorbell.jpg",
                'featured_image_original_name' => "doorbell.jpg",
            ],
            [
                'name' => "Wireless Charging Stand",
                'description' => "Adjustable wireless charging stand for phones and watches",
                'price' => 39.99,
                'featured_image' => "images/products/charging-stand.jpg",
                'featured_image_original_name' => "charging-stand.jpg",
            ],
            [
                'name' => "Smart Plug",
                'description' => "WiFi smart plug with energy monitoring",
                'price' => 24.99,
                'featured_image' => "images/products/plug.jpg",
                'featured_image_original_name' => "plug.jpg",
            ],
            [
                'name' => "Bluetooth Car Kit",
                'description' => "Hands-free car kit with noise cancellation",
                'price' => 49.99,
                'featured_image' => "images/products/carkit.jpg",
                'featured_image_original_name' => "carkit.jpg",
            ],
            [
                'name' => "Smart Water Bottle",
                'description' => "Hydration tracking water bottle with app integration",
                'price' => 34.99,
                'featured_image' => "images/products/bottle.jpg",
                'featured_image_original_name' => "bottle.jpg",
            ],
        ];

        foreach ($products as $product) {
            Product::create($product);
        }
    }
}
