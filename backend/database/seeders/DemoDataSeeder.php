<?php

namespace Database\Seeders;

use App\Models\Payment;
use App\Models\Reservation;
use App\Models\User;
use App\Models\Vehicle;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        // Bundled vehicle photos (see files/vehicles/CREDITS.md)
        foreach (glob(__DIR__ . "/files/vehicles/*.{jpg,png}", GLOB_BRACE) as $img) {
            Storage::disk("public")->put("vehicles/" . basename($img), file_get_contents($img));
        }

        // ── Extra users ────────────────────────────────────────────────────────
        $manager = User::whereHas('roles', fn($q) => $q->where('name', 'manager'))->first();
        $admin   = User::whereHas('roles', fn($q) => $q->where('name', 'admin'))->first();

        $sarah = User::firstOrCreate(
            ['email' => 'sarah.johnson@example.com'],
            [
                'name'     => 'Sarah Johnson',
                'password' => bcrypt('Client@123456'),
                'phone'    => '+1 555 201 3344',
                'address'  => '45 Maple Avenue, Boston, MA',
            ]
        );
        $sarah->syncRoles(['client']);

        $mike = User::firstOrCreate(
            ['email' => 'mike.davis@example.com'],
            [
                'name'     => 'Mike Davis',
                'password' => bcrypt('Client@123456'),
                'phone'    => '+1 555 404 7788',
                'address'  => '200 Oak Street, Chicago, IL',
            ]
        );
        $mike->syncRoles(['client']);

        $emma = User::firstOrCreate(
            ['email' => 'emma.wilson@example.com'],
            [
                'name'     => 'Emma Wilson',
                'password' => bcrypt('Client@123456'),
                'phone'    => '+1 555 789 0011',
                'address'  => '88 Pine Road, Los Angeles, CA',
            ]
        );
        $emma->syncRoles(['client']);

        $existingClient = User::where('email', 'client@carsrental.com')->first();

        // ── Extra vehicles (added by manager) ─────────────────────────────────
        $createdBy = $manager?->id ?? $admin?->id ?? 1;

        $extraVehicles = [
            [
                'brand'         => 'Audi',
                'model'         => 'A4',
                'category'      => 'sedan',
                'transmission'  => 'automatic',
                'fuel_type'     => 'petrol',
                'price_per_day' => 85.00,
                'description'   => 'Refined German engineering with a sporty edge.',
                'is_available'  => true,
                'year'          => 2023,
                'seats'         => 5,
                'color'         => 'Quantum Gray',
                'license_plate' => 'XYZ-2001',
                'image'         => 'https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?w=800&q=80',
            ],
            [
                'brand'         => 'Land Rover',
                'model'         => 'Range Rover Sport',
                'category'      => 'suv',
                'transmission'  => 'automatic',
                'fuel_type'     => 'hybrid',
                'price_per_day' => 220.00,
                'description'   => 'Premium SUV combining luxury and off-road capability.',
                'is_available'  => true,
                'year'          => 2024,
                'seats'         => 5,
                'color'         => 'Santorini Black',
                'license_plate' => 'XYZ-2002',
                'image'         => 'vehicles/range-rover-sport.jpg',
            ],
            [
                'brand'         => 'Volkswagen',
                'model'         => 'Golf',
                'category'      => 'economy',
                'transmission'  => 'manual',
                'fuel_type'     => 'petrol',
                'price_per_day' => 55.00,
                'description'   => 'Iconic compact hatchback with superb handling.',
                'is_available'  => true,
                'year'          => 2022,
                'seats'         => 5,
                'color'         => 'Deep Black',
                'license_plate' => 'XYZ-2003',
                'image'         => 'https://images.unsplash.com/photo-1471444928139-48c5bf5173f8?w=800&q=80',
            ],
            [
                'brand'         => 'Nissan',
                'model'         => 'Altima',
                'category'      => 'sedan',
                'transmission'  => 'automatic',
                'fuel_type'     => 'petrol',
                'price_per_day' => 70.00,
                'description'   => 'Stylish mid-size sedan with excellent fuel economy.',
                'is_available'  => true,
                'year'          => 2023,
                'seats'         => 5,
                'color'         => 'Pearl White',
                'license_plate' => 'XYZ-2004',
                'image'         => 'vehicles/nissan-altima.png',
            ],
            [
                'brand'         => 'Mercedes-Benz',
                'model'         => 'E-Class',
                'category'      => 'luxury',
                'transmission'  => 'automatic',
                'fuel_type'     => 'diesel',
                'price_per_day' => 195.00,
                'description'   => 'Executive class comfort with state-of-the-art technology.',
                'is_available'  => true,
                'year'          => 2024,
                'seats'         => 5,
                'color'         => 'Obsidian Black',
                'license_plate' => 'XYZ-2005',
                'image'         => 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80',
            ],
            [
                'brand'         => 'Toyota',
                'model'         => 'Sienna',
                'category'      => 'van',
                'transmission'  => 'automatic',
                'fuel_type'     => 'hybrid',
                'price_per_day' => 115.00,
                'description'   => 'Family-friendly minivan with hybrid efficiency.',
                'is_available'  => true,
                'year'          => 2023,
                'seats'         => 8,
                'color'         => 'Blueprint Blue',
                'license_plate' => 'XYZ-2006',
                'image'         => 'vehicles/toyota-sienna.jpg',
            ],
        ];

        foreach ($extraVehicles as $v) {
            Vehicle::firstOrCreate(
                ['license_plate' => $v['license_plate']],
                array_merge($v, ['created_by' => $createdBy])
            );
        }

        // ── Reload vehicles from DB ────────────────────────────────────────────
        $camry      = Vehicle::where('license_plate', 'ABC-1001')->first();
        $explorer   = Vehicle::where('license_plate', 'ABC-1002')->first();
        $tesla      = Vehicle::where('license_plate', 'ABC-1003')->first();
        $bmw        = Vehicle::where('license_plate', 'ABC-1004')->first();
        $silverado  = Vehicle::where('license_plate', 'ABC-1005')->first();
        $civic      = Vehicle::where('license_plate', 'ABC-1006')->first();
        $sprinter   = Vehicle::where('license_plate', 'ABC-1007')->first();
        $cayenne    = Vehicle::where('license_plate', 'ABC-1008')->first();
        $audi       = Vehicle::where('license_plate', 'XYZ-2001')->first();
        $rangeRover = Vehicle::where('license_plate', 'XYZ-2002')->first();
        $golf       = Vehicle::where('license_plate', 'XYZ-2003')->first();
        $altima     = Vehicle::where('license_plate', 'XYZ-2004')->first();
        $eclass     = Vehicle::where('license_plate', 'XYZ-2005')->first();
        $sienna     = Vehicle::where('license_plate', 'XYZ-2006')->first();

        // ── Reservations ──────────────────────────────────────────────────────
        $now = Carbon::now();

        $reservationDefs = [
            // Sarah - 3 reservations
            [
                'user'       => $sarah,
                'vehicle'    => $camry,
                'start'      => $now->copy()->subDays(40),
                'end'        => $now->copy()->subDays(37),
                'status'     => 'paid',
                'pay_status' => 'paid',
                'paid'       => true,
            ],
            [
                'user'       => $sarah,
                'vehicle'    => $bmw,
                'start'      => $now->copy()->subDays(15),
                'end'        => $now->copy()->subDays(12),
                'status'     => 'paid',
                'pay_status' => 'paid',
                'paid'       => true,
            ],
            [
                'user'       => $sarah,
                'vehicle'    => $rangeRover,
                'start'      => $now->copy()->addDays(5),
                'end'        => $now->copy()->addDays(8),
                'status'     => 'confirmed',
                'pay_status' => 'unpaid',
                'paid'       => false,
            ],
            // Mike - 3 reservations
            [
                'user'       => $mike,
                'vehicle'    => $explorer,
                'start'      => $now->copy()->subDays(60),
                'end'        => $now->copy()->subDays(55),
                'status'     => 'paid',
                'pay_status' => 'paid',
                'paid'       => true,
            ],
            [
                'user'       => $mike,
                'vehicle'    => $audi,
                'start'      => $now->copy()->addDays(3),
                'end'        => $now->copy()->addDays(6),
                'status'     => 'pending',
                'pay_status' => 'unpaid',
                'paid'       => false,
            ],
            [
                'user'       => $mike,
                'vehicle'    => $cayenne,
                'start'      => $now->copy()->subDays(10),
                'end'        => $now->copy()->subDays(7),
                'status'     => 'cancelled',
                'pay_status' => 'unpaid',
                'paid'       => false,
            ],
            // Emma - 3 reservations
            [
                'user'       => $emma,
                'vehicle'    => $civic,
                'start'      => $now->copy()->subDays(20),
                'end'        => $now->copy()->subDays(17),
                'status'     => 'paid',
                'pay_status' => 'paid',
                'paid'       => true,
            ],
            [
                'user'       => $emma,
                'vehicle'    => $tesla,
                'start'      => $now->copy()->addDays(12),
                'end'        => $now->copy()->addDays(15),
                'status'     => 'pending',
                'pay_status' => 'unpaid',
                'paid'       => false,
            ],
            [
                'user'       => $emma,
                'vehicle'    => $eclass,
                'start'      => $now->copy()->subDays(50),
                'end'        => $now->copy()->subDays(47),
                'status'     => 'paid',
                'pay_status' => 'paid',
                'paid'       => true,
            ],
            // Original client - 4 reservations
            [
                'user'       => $existingClient,
                'vehicle'    => $silverado,
                'start'      => $now->copy()->subDays(90),
                'end'        => $now->copy()->subDays(85),
                'status'     => 'paid',
                'pay_status' => 'paid',
                'paid'       => true,
            ],
            [
                'user'       => $existingClient,
                'vehicle'    => $sprinter,
                'start'      => $now->copy()->subDays(30),
                'end'        => $now->copy()->subDays(26),
                'status'     => 'paid',
                'pay_status' => 'paid',
                'paid'       => true,
            ],
            [
                'user'       => $existingClient,
                'vehicle'    => $golf,
                'start'      => $now->copy()->addDays(1),
                'end'        => $now->copy()->addDays(4),
                'status'     => 'confirmed',
                'pay_status' => 'unpaid',
                'paid'       => false,
            ],
            [
                'user'       => $existingClient,
                'vehicle'    => $sienna,
                'start'      => $now->copy()->addDays(20),
                'end'        => $now->copy()->addDays(25),
                'status'     => 'pending',
                'pay_status' => 'unpaid',
                'paid'       => false,
            ],
        ];

        foreach ($reservationDefs as $def) {
            if (!$def['user'] || !$def['vehicle']) continue;

            $start = $def['start']->toDateString();
            $end   = $def['end']->toDateString();
            $days  = (int) $def['start']->diffInDays($def['end']);
            $days  = max(1, $days);
            $total = round($def['vehicle']->price_per_day * $days, 2);

            $alreadyExists = Reservation::where('user_id', $def['user']->id)
                ->where('vehicle_id', $def['vehicle']->id)
                ->where('start_date', $start)
                ->exists();

            if ($alreadyExists) continue;

            $reservation = Reservation::create([
                'user_id'          => $def['user']->id,
                'vehicle_id'       => $def['vehicle']->id,
                'start_date'       => $start,
                'end_date'         => $end,
                'total_days'       => $days,
                'total_price'      => $total,
                'status'           => $def['status'],
                'payment_status'   => $def['pay_status'],
                'pickup_location'  => 'Main Office - Downtown',
                'return_location'  => 'Main Office - Downtown',
                'confirmed_at'     => in_array($def['status'], ['confirmed', 'paid'])
                    ? $now->copy()->subDays(2)
                    : null,
                'confirmed_by'     => in_array($def['status'], ['confirmed', 'paid'])
                    ? $manager?->id
                    : null,
                'cancelled_at'     => $def['status'] === 'cancelled'
                    ? $def['end']->copy()->subDays(1)
                    : null,
                'cancellation_reason' => $def['status'] === 'cancelled'
                    ? 'Plans changed, no longer needed.'
                    : null,
            ]);

            if ($def['paid']) {
                Payment::create([
                    'reservation_id'   => $reservation->id,
                    'user_id'          => $def['user']->id,
                    'amount'           => $total,
                    'method'           => 'mock',
                    'status'           => 'completed',
                    'transaction_id'   => 'MOCK-' . strtoupper(Str::random(16)),
                    'paid_at'          => $def['end']->copy()->subDays(1),
                    'gateway_response' => ['mock' => true, 'auto_approved' => true],
                ]);
            }
        }

        $this->command->info('Demo data seeded: 3 extra clients, 6 extra vehicles, 13 reservations.');
    }
}
