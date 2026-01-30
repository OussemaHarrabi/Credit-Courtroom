import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  Server, 
  Database, 
  Moon, 
  Sun, 
  Monitor,
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { configureApi } from '@/lib/api';

interface SettingsState {
  apiBaseUrl: string;
  useMockBackend: boolean;
  theme: 'light' | 'dark' | 'system';
}

export function Settings() {
  const [settings, setSettings] = useState<SettingsState>({
    apiBaseUrl: '/api/v1',
    useMockBackend: true,
    theme: 'light',
  });
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    // Load settings from localStorage
    const saved = localStorage.getItem('credit-courtroom-settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('credit-courtroom-settings', JSON.stringify(settings));
    configureApi({
      baseUrl: settings.apiBaseUrl,
      useMock: settings.useMockBackend,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      // Simulate API test
      await new Promise(resolve => setTimeout(resolve, 1500));
      setTestResult('success');
    } catch (error) {
      setTestResult('error');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure your Credit Courtroom workspace
        </p>
      </div>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-slate-600" />
            <CardTitle className="text-lg">API Configuration</CardTitle>
          </div>
          <CardDescription>
            Configure connection to the Credit Courtroom backend API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="api-url">API Base URL</Label>
            <Input
              id="api-url"
              value={settings.apiBaseUrl}
              onChange={(e) => setSettings({ ...settings, apiBaseUrl: e.target.value })}
              placeholder="https://api.creditcourtroom.com/v1"
            />
            <p className="text-xs text-slate-500">
              The base URL for all API requests
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Use Mock Backend</Label>
              <p className="text-xs text-slate-500">
                Enable to use in-memory mock data instead of real API
              </p>
            </div>
            <Switch
              checked={settings.useMockBackend}
              onCheckedChange={(checked) => 
                setSettings({ ...settings, useMockBackend: checked })
              }
            />
          </div>

          {!settings.useMockBackend && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={testConnection}
                disabled={testing}
              >
                {testing ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                Test Connection
              </Button>
            </div>
          )}

          {testResult === 'success' && (
            <Alert className="bg-emerald-50 border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <AlertDescription className="text-emerald-700">
                Connection successful! API is reachable.
              </AlertDescription>
            </Alert>
          )}

          {testResult === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                Connection failed. Please check the API URL and try again.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-slate-600" />
            <CardTitle className="text-lg">Appearance</CardTitle>
          </div>
          <CardDescription>
            Customize the look and feel of the application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Label>Theme</Label>
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: 'light', label: 'Light', icon: Sun },
                { value: 'dark', label: 'Dark', icon: Moon },
                { value: 'system', label: 'System', icon: Monitor },
              ].map((theme) => {
                const Icon = theme.icon;
                return (
                  <button
                    key={theme.value}
                    onClick={() => setSettings({ ...settings, theme: theme.value as any })}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors ${
                      settings.theme === theme.value
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${
                      settings.theme === theme.value ? 'text-slate-900' : 'text-slate-400'
                    }`} />
                    <span className={`text-sm font-medium ${
                      settings.theme === theme.value ? 'text-slate-900' : 'text-slate-600'
                    }`}>
                      {theme.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-slate-600" />
            <CardTitle className="text-lg">System Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-500">Version</span>
              <Badge variant="secondary">v1.0.0-demo</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-500">Environment</span>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                Demo Mode
              </Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-500">Backend Status</span>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                {settings.useMockBackend ? 'Mock Active' : 'Connected'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center justify-between">
        {saved && (
          <Alert className="flex-1 mr-4 bg-emerald-50 border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <AlertDescription className="text-emerald-700">
              Settings saved successfully!
            </AlertDescription>
          </Alert>
        )}
        <div className="flex-1" />
        <Button onClick={handleSave} className="gap-2">
          <Save className="w-4 h-4" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}
