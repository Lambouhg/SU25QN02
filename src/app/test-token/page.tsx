"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, RefreshCw } from 'lucide-react';

export default function TestTokenPage() {
    const { userId, getToken } = useAuth();
    const [token, setToken] = useState<string>('');
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false);

    const getCurrentToken = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            setToken(token || '');
        } catch (error) {
            console.error('Error getting token:', error);
        } finally {
            setLoading(false);
        }
    };

    const copyToken = async () => {
        if (token) {
            await navigator.clipboard.writeText(token);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    useEffect(() => {
        if (userId) {
            getCurrentToken();
        }
    }, [userId]);

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">🔑 Token Debug Tool</h1>
                <p className="text-gray-600">Lấy token để test API user-package và service-package</p>
            </div>

            <div className="grid gap-6">
                {/* User Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            👤 User Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold">User ID:</span>
                                <Badge variant="secondary">{userId || 'Not logged in'}</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Token Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            🎫 Current Token
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <Button
                                    onClick={getCurrentToken}
                                    disabled={loading}
                                    className="flex items-center gap-2"
                                >
                                    {loading ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <RefreshCw className="w-4 h-4" />
                                    )}
                                    {loading ? 'Getting Token...' : 'Get Token'}
                                </Button>

                                {token && (
                                    <Button
                                        onClick={copyToken}
                                        variant="outline"
                                        className="flex items-center gap-2"
                                    >
                                        {copied ? (
                                            <Check className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <Copy className="w-4 h-4" />
                                        )}
                                        {copied ? 'Copied!' : 'Copy Token'}
                                    </Button>
                                )}
                            </div>

                            {token && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Token:</label>
                                    <Input
                                        value={token}
                                        readOnly
                                        className="font-mono text-xs"
                                    />
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* API Testing Guide */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            📋 API Testing Guide
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold mb-2">Headers for API calls:</h3>
                                <div className="bg-gray-100 p-3 rounded font-mono text-sm">
                                    Authorization: Bearer YOUR_TOKEN_HERE
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-2">API Endpoints:</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="bg-blue-50 p-2 rounded">
                                        <strong>GET</strong> /api/service-package - Lấy danh sách gói dịch vụ
                                    </div>
                                    <div className="bg-green-50 p-2 rounded">
                                        <strong>POST</strong> /api/service-package - Tạo gói dịch vụ mới
                                    </div>
                                    <div className="bg-purple-50 p-2 rounded">
                                        <strong>GET</strong> /api/user-package - Lấy gói của user
                                    </div>
                                    <div className="bg-orange-50 p-2 rounded">
                                        <strong>POST</strong> /api/user-package - Mua gói dịch vụ
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-2">Example Postman Request:</h3>
                                <div className="bg-gray-100 p-3 rounded font-mono text-xs">
                                    <div>URL: http://localhost:3002/api/user-package</div>
                                    <div>Method: GET</div>
                                    <div>Headers:</div>
                                    <div>  Authorization: Bearer {token ? token.substring(0, 20) + '...' : 'YOUR_TOKEN'}</div>
                                    <div>  Content-Type: application/json</div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 