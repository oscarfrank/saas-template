import { Head } from '@inertiajs/react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const currencies = [
    { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
];

const termTypes = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
];

const durationOptions = [
    { value: 6, label: '6 months' },
    { value: 12, label: '1 year' },
    { value: 24, label: '2 years' },
    { value: 36, label: '3 years' },
    { value: 48, label: '4 years' },
    { value: 60, label: '5 years' },
];

export default function Calculator() {
    const [loanAmount, setLoanAmount] = useState(10000);
    const [loanTerm, setLoanTerm] = useState(12);
    const [interestRate, setInterestRate] = useState(5);
    const [loanType, setLoanType] = useState('personal');
    const [selectedCurrency, setSelectedCurrency] = useState('NGN');
    const [formattedLoanAmount, setFormattedLoanAmount] = useState('10,000');
    const [termType, setTermType] = useState('monthly');
    const [duration, setDuration] = useState(12);

    const formatNumber = (number: number) => {
        return new Intl.NumberFormat('en-US').format(number);
    };

    const parseNumber = (formattedNumber: string) => {
        return parseInt(formattedNumber.replace(/,/g, ''), 10) || 0;
    };

    const formatCurrency = (amount: number) => {
        const currency = currencies.find(c => c.code === selectedCurrency);
        if (!currency) return amount.toString();
        
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: selectedCurrency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const calculateMonthlyPayment = () => {
        // For monthly interest payments
        if (termType === 'yearly') {
            return (loanAmount * (interestRate / 100)) / 12;
        }
        return loanAmount * (interestRate / 100);
    };

    const calculateTotalInterest = () => {
        return calculateMonthlyPayment() * duration;
    };

    const calculateTotalPayment = () => {
        return loanAmount + calculateTotalInterest();
    };

    const calculateAPR = () => {
        if (termType === 'yearly') {
            return interestRate;
        }
        // Convert monthly rate to APR
        return ((Math.pow(1 + (interestRate / 100), 12) - 1) * 100).toFixed(2);
    };

    const handleLoanAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        
        // Allow empty input
        if (value === '') {
            setFormattedLoanAmount('');
            setLoanAmount(0);
            return;
        }

        // Remove all non-digit characters
        const cleanValue = value.replace(/\D/g, '');
        
        // If the value is empty after cleaning, don't update
        if (cleanValue === '') {
            setFormattedLoanAmount('');
            setLoanAmount(0);
            return;
        }

        const numericValue = parseInt(cleanValue, 10);
        
        // Format the number with commas
        const formattedValue = new Intl.NumberFormat('en-US').format(numericValue);
        setFormattedLoanAmount(formattedValue);
        
        // Only update the actual loan amount if it's within valid range
        if (numericValue >= 1000 && numericValue <= 1000000) {
            setLoanAmount(numericValue);
        }
    };

    return (
        <>
            <Head title="Loan Calculator - LendFast" />
            <div className="min-h-screen bg-white dark:bg-gray-900">
                <Header />
                <main>
                    <section className="py-20">
                        <div className="container mx-auto px-6">
                            <div className="max-w-4xl mx-auto">
                                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                                    Loan Calculator
                                </h1>
                                <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 text-center">
                                    Estimate your monthly payments and total interest
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div className="space-y-8">
                                        <div className="space-y-4">
                                            <Label htmlFor="currency">Currency</Label>
                                            <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select currency" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {currencies.map((currency) => (
                                                        <SelectItem key={currency.code} value={currency.code}>
                                                            {currency.name} ({currency.symbol})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-4">
                                            <Label htmlFor="loanType">Loan Type</Label>
                                            <Select value={loanType} onValueChange={setLoanType}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select loan type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="personal">Personal Loan</SelectItem>
                                                    <SelectItem value="business">Business Loan</SelectItem>
                                                    <SelectItem value="education">Education Loan</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-4">
                                            <Label htmlFor="loanAmount">Loan Amount</Label>
                                            <div className="flex items-center space-x-4">
                                                <Input
                                                    type="text"
                                                    id="loanAmount"
                                                    value={formattedLoanAmount}
                                                    onChange={handleLoanAmountChange}
                                                    className="text-right"
                                                />
                                                <span className="text-gray-600 dark:text-gray-300">
                                                    {currencies.find(c => c.code === selectedCurrency)?.symbol}
                                                </span>
                                            </div>
                                            <Slider
                                                value={[loanAmount]}
                                                onValueChange={([value]) => {
                                                    setLoanAmount(value);
                                                    setFormattedLoanAmount(formatNumber(value));
                                                }}
                                                min={1000}
                                                max={1000000}
                                                step={1000}
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <Label htmlFor="termType">Interest Rate Type</Label>
                                            <Select value={termType} onValueChange={setTermType}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select term type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {termTypes.map((type) => (
                                                        <SelectItem key={type.value} value={type.value}>
                                                            {type.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-4">
                                            <Label htmlFor="interestRate">Interest Rate ({termType === 'yearly' ? 'per year' : 'per month'})</Label>
                                            <div className="flex items-center space-x-4">
                                                <Input
                                                    type="number"
                                                    id="interestRate"
                                                    value={interestRate}
                                                    onChange={(e) => setInterestRate(Number(e.target.value))}
                                                    min="1"
                                                    max={termType === 'yearly' ? "20" : "5"}
                                                    step="0.1"
                                                />
                                                <span className="text-gray-600 dark:text-gray-300">%</span>
                                            </div>
                                            <Slider
                                                value={[interestRate]}
                                                onValueChange={([value]) => setInterestRate(value)}
                                                min={1}
                                                max={termType === 'yearly' ? 50 : 10}
                                                step={0.1}
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <Label htmlFor="duration">Loan Duration</Label>
                                            <Select value={duration.toString()} onValueChange={(value) => setDuration(Number(value))}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select duration" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {durationOptions.map((option) => (
                                                        <SelectItem key={option.value} value={option.value.toString()}>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl">
                                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                                            Your Results
                                        </h2>
                                        <div className="space-y-6">
                                            <div>
                                                <p className="text-gray-600 dark:text-gray-300">Monthly Interest Payment</p>
                                                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                                    {formatCurrency(calculateMonthlyPayment())}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600 dark:text-gray-300">Total Interest</p>
                                                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                                    {formatCurrency(calculateTotalInterest())}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600 dark:text-gray-300">Principal Due at End</p>
                                                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                                    {formatCurrency(loanAmount)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600 dark:text-gray-300">Total Amount to be Repaid</p>
                                                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                                    {formatCurrency(calculateTotalPayment())}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600 dark:text-gray-300">Number of Interest Payments</p>
                                                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                                    {duration}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>
                <Footer />
            </div>
        </>
    );
} 