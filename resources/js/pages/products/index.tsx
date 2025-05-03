import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { DataTable } from '@/components/ui/data-table';
import { columns } from './details/table-columns';
import { type Product } from './details/table-columns';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Products',
        href: '/products',
    },
];

const sampleProducts: Product[] = [
    {
        id: 2,
        name: "Smart Fitness Watch",
        description: "Track your fitness goals with this advanced smartwatch featuring heart rate monitoring and GPS",
        price: 199.99,
        featured_image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
        featured_image_original_name: "smartwatch.jpg",
        created_at: "2024-01-16T14:20:00Z",
        updated_at: "2024-01-16T14:20:00Z"
    },
    {
        id: 3,
        name: "Professional Camera Kit",
        description: "Complete DSLR camera kit with 18-55mm lens, tripod, and carrying case",
        price: 899.99,
        featured_image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32",
        featured_image_original_name: "camera.jpg",
        created_at: "2024-01-17T09:15:00Z",
        updated_at: "2024-01-17T09:15:00Z"
    },
    {
        id: 4,
        name: "Ergonomic Office Chair",
        description: "Comfortable and supportive office chair with adjustable height and lumbar support",
        price: 249.99,
        featured_image: "https://images.unsplash.com/photo-1592078615290-033ee584e267",
        featured_image_original_name: "chair.jpg",
        created_at: "2024-01-18T11:45:00Z",
        updated_at: "2024-01-18T11:45:00Z"
    },
    {
        id: 6,
        name: "Mechanical Gaming Keyboard",
        description: "RGB backlit mechanical keyboard with programmable keys",
        price: 89.99,
        featured_image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3",
        featured_image_original_name: "keyboard.jpg",
        created_at: "2024-01-20T13:20:00Z",
        updated_at: "2024-01-20T13:20:00Z"
    },
    {
        id: 7,
        name: "4K Ultra HD Monitor",
        description: "27-inch 4K monitor with HDR support and USB-C connectivity",
        price: 399.99,
        featured_image: "https://images.unsplash.com/photo-1542751371-adc38448a05e",
        featured_image_original_name: "monitor.jpg",
        created_at: "2024-01-21T10:10:00Z",
        updated_at: "2024-01-21T10:10:00Z"
    },
    {
        id: 8,
        name: "Wireless Charging Pad",
        description: "Fast wireless charging pad compatible with all Qi-enabled devices",
        price: 49.99,
        featured_image: "https://images.unsplash.com/photo-1583394838336-acd977736f90",
        featured_image_original_name: "charger.jpg",
        created_at: "2024-01-22T15:40:00Z",
        updated_at: "2024-01-22T15:40:00Z"
    },
    {
        id: 9,
        name: "Smart Home Security Camera",
        description: "1080p security camera with night vision and motion detection",
        price: 79.99,
        featured_image: "https://images.unsplash.com/photo-1585366119957-e9730b6d0f60",
        featured_image_original_name: "camera.jpg",
        created_at: "2024-01-23T09:25:00Z",
        updated_at: "2024-01-23T09:25:00Z"
    },
    {
        id: 10,
        name: "Gaming Mouse",
        description: "High-precision gaming mouse with customizable DPI settings",
        price: 59.99,
        featured_image: "https://images.unsplash.com/photo-1527814050087-3793815479db",
        featured_image_original_name: "mouse.jpg",
        created_at: "2024-01-24T14:15:00Z",
        updated_at: "2024-01-24T14:15:00Z"
    },
    {
        id: 11,
        name: "External SSD Drive",
        description: "1TB external SSD with USB 3.2 Gen 2 support",
        price: 149.99,
        featured_image: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45",
        featured_image_original_name: "ssd.jpg",
        created_at: "2024-01-25T11:30:00Z",
        updated_at: "2024-01-25T11:30:00Z"
    },
    {
        id: 12,
        name: "Smart LED Light Bulbs",
        description: "Set of 4 color-changing smart bulbs with app control",
        price: 69.99,
        featured_image: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15",
        featured_image_original_name: "bulbs.jpg",
        created_at: "2024-01-26T16:45:00Z",
        updated_at: "2024-01-26T16:45:00Z"
    },
    {
        id: 13,
        name: "Laptop Stand",
        description: "Adjustable aluminum laptop stand for better ergonomics",
        price: 39.99,
        featured_image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed",
        featured_image_original_name: "stand.jpg",
        created_at: "2024-01-27T10:20:00Z",
        updated_at: "2024-01-27T10:20:00Z"
    },
    {
        id: 14,
        name: "Noise Cancelling Earbuds",
        description: "True wireless earbuds with active noise cancellation",
        price: 179.99,
        featured_image: "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb",
        featured_image_original_name: "earbuds.jpg",
        created_at: "2024-01-28T13:50:00Z",
        updated_at: "2024-01-28T13:50:00Z"
    },
    {
        id: 15,
        name: "Smart Door Lock",
        description: "Keyless entry smart lock with fingerprint and app control",
        price: 199.99,
        featured_image: "https://images.unsplash.com/photo-1584622650111-993ec426f72a",
        featured_image_original_name: "lock.jpg",
        created_at: "2024-01-29T09:35:00Z",
        updated_at: "2024-01-29T09:35:00Z"
    },
    {
        id: 16,
        name: "Portable Power Bank",
        description: "20000mAh power bank with fast charging support",
        price: 49.99,
        featured_image: "https://images.unsplash.com/photo-1589209814680-0d1a2fafdf44",
        featured_image_original_name: "powerbank.jpg",
        created_at: "2024-01-30T15:25:00Z",
        updated_at: "2024-01-30T15:25:00Z"
    },
    {
        id: 17,
        name: "Smart Thermostat",
        description: "WiFi-enabled thermostat with learning capabilities",
        price: 129.99,
        featured_image: "https://images.unsplash.com/photo-1581094794329-c8112c4e0e0c",
        featured_image_original_name: "thermostat.jpg",
        created_at: "2024-01-31T11:15:00Z",
        updated_at: "2024-01-31T11:15:00Z"
    },
    {
        id: 18,
        name: "Wireless Gaming Controller",
        description: "Ergonomic controller with customizable buttons",
        price: 69.99,
        featured_image: "https://images.unsplash.com/photo-1600080972464-8e5f35f63d08",
        featured_image_original_name: "controller.jpg",
        created_at: "2024-02-01T14:40:00Z",
        updated_at: "2024-02-01T14:40:00Z"
    },
    {
        id: 19,
        name: "Smart Scale",
        description: "Digital scale with body composition analysis",
        price: 89.99,
        featured_image: "https://images.unsplash.com/photo-1581094794329-c8112c4e0e0c",
        featured_image_original_name: "scale.jpg",
        created_at: "2024-02-02T10:50:00Z",
        updated_at: "2024-02-02T10:50:00Z"
    },
    {
        id: 20,
        name: "USB-C Hub",
        description: "7-in-1 USB-C hub with HDMI, USB-A, and SD card slots",
        price: 59.99,
        featured_image: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45",
        featured_image_original_name: "hub.jpg",
        created_at: "2024-02-03T16:20:00Z",
        updated_at: "2024-02-03T16:20:00Z"
    },
    {
        id: 21,
        name: "Smart Doorbell",
        description: "Video doorbell with motion detection and two-way audio",
        price: 149.99,
        featured_image: "https://images.unsplash.com/photo-1585366119957-e9730b6d0f60",
        featured_image_original_name: "doorbell.jpg",
        created_at: "2024-02-04T09:30:00Z",
        updated_at: "2024-02-04T09:30:00Z"
    },
    {
        id: 22,
        name: "Wireless Charging Stand",
        description: "Adjustable wireless charging stand for phones and watches",
        price: 39.99,
        featured_image: "https://images.unsplash.com/photo-1583394838336-acd977736f90",
        featured_image_original_name: "stand.jpg",
        created_at: "2024-02-05T13:45:00Z",
        updated_at: "2024-02-05T13:45:00Z"
    },
    {
        id: 23,
        name: "Smart Plug",
        description: "WiFi smart plug with energy monitoring",
        price: 24.99,
        featured_image: "https://images.unsplash.com/photo-1581094794329-c8112c4e0e0c",
        featured_image_original_name: "plug.jpg",
        created_at: "2024-02-06T11:20:00Z",
        updated_at: "2024-02-06T11:20:00Z"
    },
    {
        id: 24,
        name: "Bluetooth Car Kit",
        description: "Hands-free car kit with noise cancellation",
        price: 49.99,
        featured_image: "https://images.unsplash.com/photo-1583394838336-acd977736f90",
        featured_image_original_name: "carkit.jpg",
        created_at: "2024-02-07T15:10:00Z",
        updated_at: "2024-02-07T15:10:00Z"
    },
    {
        id: 25,
        name: "Smart Water Bottle",
        description: "Hydration tracking water bottle with app integration",
        price: 34.99,
        featured_image: "https://images.unsplash.com/photo-1581094794329-c8112c4e0e0c",
        featured_image_original_name: "bottle.jpg",
        created_at: "2024-02-08T10:40:00Z",
        updated_at: "2024-02-08T10:40:00Z"
    }
];

export default function Index() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products Management" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-end">
                    <Link href={route('products.create')}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Product
                        </Button>
                    </Link>
                </div>
                <DataTable
                    columns={columns}
                    data={sampleProducts}
                    searchPlaceholder="Search products..."
                    searchColumns={["name", "description", "price"]}
                />
            </div>
        </AppLayout>
    );
}
