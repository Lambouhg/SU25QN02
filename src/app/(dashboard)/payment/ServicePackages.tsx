"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ServicePackage {
    id: string;
    name: string;
    price: number;
    duration: number;
    avatarInterviewLimit: number;
    testQuizEQLimit: number;
    jdUploadLimit: number;
    description: string;
    highlight: boolean;
    isActive: boolean;
}

export default function ServicePackages() {
    const [packages, setPackages] = useState<ServicePackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        try {
            const response = await fetch('/api/service-package');
            const data = await response.json();

            if (response.ok) {
                setPackages(data.filter((pkg: ServicePackage) => pkg.isActive !== false));
            } else {
                setError(data.error || 'Failed to fetch packages');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async (packageId: string) => {
        try {
            const response = await fetch('/api/user-package', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ servicePackageId: packageId }),
            });

            const data = await response.json();

            if (response.ok) {
                alert('Mua gói thành công!');
                // Refresh packages or redirect
            } else {
                alert(data.error || 'Mua gói thất bại');
            }
        } catch (err) {
            alert('Lỗi mạng');
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64">Loading...</div>;
    }

    if (error) {
        return <div className="text-red-500 text-center">{error}</div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {packages.map((pkg) => (
                <Card key={pkg.id} className={`${pkg.highlight ? 'border-2 border-blue-500' : ''}`}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-xl">{pkg.name}</CardTitle>
                                <CardDescription>{pkg.description}</CardDescription>
                            </div>
                            {pkg.highlight && (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                    Popular
                                </Badge>
                            )}
                        </div>
                        <div className="text-3xl font-bold text-green-600">
                            {pkg.price.toLocaleString('vi-VN')} VND
                        </div>
                        <div className="text-sm text-gray-500">
                            {pkg.duration} ngày
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between">
                                <span>Avatar Interview:</span>
                                <span className="font-semibold">{pkg.avatarInterviewLimit} lần</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Test Quiz EQ:</span>
                                <span className="font-semibold">{pkg.testQuizEQLimit} lần</span>
                            </div>
                            <div className="flex justify-between">
                                <span>JD Upload:</span>
                                <span className="font-semibold">{pkg.jdUploadLimit} lần</span>
                            </div>
                        </div>
                        <Button
                            onClick={() => handlePurchase(pkg.id)}
                            className="w-full"
                            variant={pkg.highlight ? "default" : "outline"}
                        >
                            Mua Gói
                        </Button>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
} 