package com.uber.entity.seeders;

import com.uber.entity.models.*;
import com.uber.entity.repository.*;
import lombok.AllArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.sql.Date;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Component
@AllArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final DriverRepository driverRepository;
    private final VehicleRepository vehicleRepository;
    private final LocationRepository locationRepository;
    private final NamedLocationRepository namedLocationRepository;
    private final BookingRepository bookingRepository;
    private final ReviewRepository reviewRepository;
    private final PaymentRepository paymentRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("Starting database seeding...");

        // Check if data already exists
        if (userRepository.count() > 0) {
            System.out.println("Database already seeded. Skipping...");
            return;
        }

        // Seed Users
        List<Users> users = seedUsers();
        System.out.println("Seeded " + users.size() + " users");

        // Seed Locations
        List<Location> locations = seedLocations();
        System.out.println("Seeded " + locations.size() + " locations");

        // Seed NamedLocations
        List<NamedLocation> namedLocations = seedNamedLocations(locations);
        System.out.println("Seeded " + namedLocations.size() + " named locations");

        // Seed Vehicles
        List<Vehicle> vehicles = seedVehicles(locations);
        System.out.println("Seeded " + vehicles.size() + " vehicles");

        // Seed Drivers
        List<Driver> drivers = seedDrivers(vehicles, locations);
        System.out.println("Seeded " + drivers.size() + " drivers");

        // Seed Bookings
        List<Booking> bookings = seedBookings(users, drivers, vehicles, locations);
        System.out.println("Seeded " + bookings.size() + " bookings");

        // Seed Reviews
        List<Review> reviews = seedReviews(bookings);
        System.out.println("Seeded " + reviews.size() + " reviews");

        // Seed Payments
        List<Payment> payments = seedPayments(bookings, users);
        System.out.println("Seeded " + payments.size() + " payments");

        System.out.println("Database seeding completed successfully!");
    }

    private List<Users> seedUsers() {
        List<Users> users = new ArrayList<>();
        String[] names = {"Ramesh Kumar", "Priya Sharma", "Arjun Reddy", "Kavya Nair", "Suresh Iyer",
                "Divya Menon", "Vikram Desai", "Ananya Patel", "Rohit Joshi", "Meera Rao"};
        String[] emails = {"ramesh@example.com", "priya@example.com", "arjun@example.com", "kavya@example.com",
                "suresh@example.com", "divya@example.com", "vikram@example.com", "ananya@example.com",
                "rohit@example.com", "meera@example.com"};
        String[] phones = {"9876543210", "9876543211", "9876543212", "9876543213", "9876543214",
                "9876543215", "9876543216", "9876543217", "9876543218", "9876543219"};

        for (int i = 0; i < names.length; i++) {
            Users user = Users.builder()
                    .name(names[i])
                    .email(emails[i])
                    .hashedPassword(passwordEncoder.encode("password123"))
                    .phoneNumber(phones[i])
                    .build();
            users.add(userRepository.save(user));
        }
        return users;
    }

    private List<Location> seedLocations() {
        List<Location> locations = new ArrayList<>();
        Random random = new Random();

        // Bengaluru city center coordinates: 12.9716° N, 77.5946° E
        double bengaluruLat = 12.9716;
        double bengaluruLon = 77.5946;

        // Seed 20 random locations around Bengaluru (within ~15km radius)
        // Each location is within approximately 0.15 degrees (~15km) of city center
        for (int i = 0; i < 20; i++) {
            double lat = bengaluruLat + (random.nextDouble() - 0.5) * 0.15;
            double lon = bengaluruLon + (random.nextDouble() - 0.5) * 0.15;

            Location location = Location.builder()
                    .latitude(lat)
                    .longitude(lon)
                    .build();
            locations.add(locationRepository.save(location));
        }
        return locations;
    }

    private List<NamedLocation> seedNamedLocations(List<Location> locations) {
        List<NamedLocation> namedLocations = new ArrayList<>();
        String[] names = {
                "Cubbon Park", "Lalbagh Botanical Garden", "Bangalore Palace", "ISKCON Temple",
                "Vidhana Soudha", "UB City Mall", "Commercial Street", "MG Road",
                "Koramangala", "Indiranagar"
        };
        String[] addresses = {
                "Kasturba Road, Near High Court", "Mavalli, Lalbagh Road", "Vasanth Nagar, Palace Road",
                "Hare Krishna Hill, Rajajinagar", "Ambedkar Veedhi, Sampangi Rama Nagar",
                "Vittal Mallya Road, UB City", "Commercial Street, Shivajinagar",
                "Mahatma Gandhi Road, Central Bangalore", "Koramangala 5th Block",
                "100 Feet Road, Indiranagar"
        };
        String[] postalCodes = {
                "560001", "560004", "560052", "560010", "560001",
                "560001", "560001", "560001", "560095", "560038"
        };

        for (int i = 0; i < Math.min(10, locations.size()); i++) {
            NamedLocation namedLocation = NamedLocation.builder()
                    .exactLocation(locations.get(i))
                    .name(names[i])
                    .address(addresses[i])
                    .city("Bengaluru")
                    .state("Karnataka")
                    .country("India")
                    .postalCode(postalCodes[i])
                    .build();
            namedLocations.add(namedLocationRepository.save(namedLocation));
        }
        return namedLocations;
    }

    private List<Vehicle> seedVehicles(List<Location> locations) {
        List<Vehicle> vehicles = new ArrayList<>();
        CarBrand[] brands = CarBrand.values();
        CarColor[] colors = CarColor.values();
        CarType[] types = CarType.values();
        Random random = new Random();

        String[] models = {"Swift", "City", "Creta", "Nexon", "Innova", "Fortuner", "Verna", "i20"};
        String[] years = {"2020", "2021", "2022", "2023", "2024"};

        // Karnataka vehicle registration format: KA-XX-XX-XXXX
        String[] karnatakaRegPrefixes = {"KA-01", "KA-02", "KA-03", "KA-04", "KA-05"};

        for (int i = 0; i < 15; i++) {
            String regNumber = karnatakaRegPrefixes[random.nextInt(karnatakaRegPrefixes.length)] 
                    + "-" + String.format("%02d", random.nextInt(100)) 
                    + "-" + String.format("%04d", 1000 + i);
            Vehicle vehicle = Vehicle.builder()
                    .regNumber(regNumber)
                    .brand(brands[random.nextInt(brands.length)])
                    .model(models[random.nextInt(models.length)])
                    .makeYear(years[random.nextInt(years.length)])
                    .Color(colors[random.nextInt(colors.length)])
                    .carType(types[random.nextInt(types.length)])
                    .isAvailable(random.nextBoolean())
                    .driverLocation(locations.get(i % locations.size()))
                    .build();
            vehicles.add(vehicleRepository.save(vehicle));
        }
        return vehicles;
    }

    private List<Driver> seedDrivers(List<Vehicle> vehicles, List<Location> locations) {
        List<Driver> drivers = new ArrayList<>();
        String[] names = {"Raj Kumar", "Amit Singh", "Vikram Patel", "Rahul Sharma", "Priya Mehta",
                "Anjali Desai", "Suresh Reddy", "Kiran Nair", "Manoj Iyer", "Deepak Joshi"};
        String[] emails = {"raj@driver.com", "amit@driver.com", "vikram@driver.com", "rahul@driver.com",
                "priya@driver.com", "anjali@driver.com", "suresh@driver.com", "kiran@driver.com",
                "manoj@driver.com", "deepak@driver.com"};
        String[] phones = {"9876543210", "9876543211", "9876543212", "9876543213", "9876543214",
                "9876543215", "9876543216", "9876543217", "9876543218", "9876543219"};
        Random random = new Random();

        for (int i = 0; i < names.length; i++) {
            Driver driver = Driver.builder()
                    .name(names[i])
                    .email(emails[i])
                    .hashedPassword(passwordEncoder.encode("driver123"))
                    .phoneNumber(phones[i])
                    .rating(3.5 + random.nextDouble() * 1.5) // Rating between 3.5 and 5.0
                    .vehicle(i < vehicles.size() ? vehicles.get(i) : null)
                    .isAvailable(random.nextBoolean())
                    .location(locations.get(i % locations.size()))
                    .build();
            drivers.add(driverRepository.save(driver));
        }
        return drivers;
    }

    private List<Booking> seedBookings(List<Users> users, List<Driver> drivers, List<Vehicle> vehicles,
                                       List<Location> locations) {
        List<Booking> bookings = new ArrayList<>();
        BookingStatus[] statuses = BookingStatus.values();
        Random random = new Random();

        for (int i = 0; i < 25; i++) {
            Users user = users.get(random.nextInt(users.size()));
            Driver driver = drivers.get(random.nextInt(drivers.size()));
            Vehicle vehicle = driver.getVehicle() != null ? driver.getVehicle() : vehicles.get(random.nextInt(vehicles.size()));
            Location pickupLocation = locations.get(random.nextInt(locations.size()));
            Location dropoffLocation = locations.get(random.nextInt(locations.size()));

            // Ensure pickup and dropoff are different
            while (pickupLocation.getId().equals(dropoffLocation.getId())) {
                dropoffLocation = locations.get(random.nextInt(locations.size()));
            }

            LocalDateTime pickupTime = LocalDateTime.now().minusDays(random.nextInt(30));
            LocalDateTime dropoffTime = pickupTime.plusHours(1 + random.nextInt(3));

            Booking booking = Booking.builder()
                    .user(user)
                    .vehicle(vehicle)
                    .driver(driver)
                    .pickupLocation(pickupLocation)
                    .dropoffLocation(dropoffLocation)
                    .pickupTime(Date.valueOf(pickupTime.toLocalDate()))
                    .dropoffTime(Date.valueOf(dropoffTime.toLocalDate()))
                    .bookingStatus(statuses[random.nextInt(statuses.length)])
                    .price(50.0 + random.nextDouble() * 450.0) // Price between ₹50 and ₹500
                    .build();
            bookings.add(bookingRepository.save(booking));
        }
        return bookings;
    }

    private List<Review> seedReviews(List<Booking> bookings) {
        List<Review> reviews = new ArrayList<>();
        Random random = new Random();
        String[] comments = {
                "Great ride, very professional driver!",
                "Smooth and comfortable journey.",
                "Driver was friendly and on time.",
                "Excellent service, highly recommend!",
                "Clean car and safe driving.",
                "Best ride experience ever!",
                "Driver knew the route well.",
                "Very satisfied with the service.",
                "Comfortable and affordable.",
                "Professional and courteous driver."
        };

        // Create reviews for completed bookings only
        List<Booking> completedBookings = bookings.stream()
                .filter(b -> b.getBookingStatus() == BookingStatus.COMPLETED)
                .toList();

        for (int i = 0; i < Math.min(15, completedBookings.size()); i++) {
            Booking booking = completedBookings.get(i);
            Review review = Review.builder()
                    .booking(booking)
                    .rating(3 + random.nextInt(3)) // Rating between 3 and 5
                    .comment(comments[random.nextInt(comments.length)])
                    .build();
            reviews.add(reviewRepository.save(review));
        }
        return reviews;
    }

    private List<Payment> seedPayments(List<Booking> bookings, List<Users> users) {
        List<Payment> payments = new ArrayList<>();
        PaymentStatus[] statuses = PaymentStatus.values();
        PaymentMethod[] methods = PaymentMethod.values();
        Random random = new Random();

        for (int i = 0; i < bookings.size(); i++) {
            Booking booking = bookings.get(i);
            Payment payment = Payment.builder()
                    .booking(booking)
                    .user(booking.getUser())
                    .paymentId("PAY" + String.format("%06d", i + 1))
                    .paymentStatus(statuses[random.nextInt(statuses.length)])
                    .paymentAmount(booking.getPrice())
                    .paymentDate(booking.getPickupTime())
                    .paymentMethod(methods[random.nextInt(methods.length)])
                    .build();
            payments.add(paymentRepository.save(payment));
        }
        return payments;
    }
}

