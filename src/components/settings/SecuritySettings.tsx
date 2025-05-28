'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Switch } from '@headlessui/react';

export default function SecuritySettings() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState({
    twoFactorEnabled: false,
    loginNotifications: true,
    suspiciousActivity: true,
    dataDownload: true,
    accountDeactivation: false,
  });
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    fetchSecuritySettings();
  }, []);

  const fetchSecuritySettings = async () => {
    try {
      const response = await fetch('/api/settings/security');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error fetching security settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (newSettings: typeof settings) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/settings/security', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });

      if (response.ok) {
        setSettings(newSettings);
      } else {
        console.error('Failed to update security settings');
      }
    } catch (error) {
      console.error('Error updating security settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (setting: keyof typeof settings) => {
    const newSettings = {
      ...settings,
      [setting]: !settings[setting],
    };
    setSettings(newSettings);
    updateSettings(newSettings);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwords.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        }),
      });

      if (response.ok) {
        setPasswordSuccess('Password changed successfully');
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const data = await response.json();
        setPasswordError(data.message || 'Failed to change password');
      }
    } catch (error) {
      setPasswordError('An error occurred while changing password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords({
      ...passwords,
      [e.target.name]: e.target.value,
    });
    setPasswordError('');
    setPasswordSuccess('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const ToggleSwitch = ({ 
    enabled, 
    onChange, 
    label, 
    description 
  }: { 
    enabled: boolean; 
    onChange: () => void; 
    label: string; 
    description?: string; 
  }) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1">
        <h3 className="text-sm font-medium text-gray-900">{label}</h3>
        {description && (
          <p className="text-sm text-gray-500">{description}</p>
        )}
      </div>
      <Switch
        checked={enabled}
        onChange={onChange}
        className={`${
          enabled ? 'bg-blue-600' : 'bg-gray-200'
        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
      >
        <span
          className={`${
            enabled ? 'translate-x-6' : 'translate-x-1'
          } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
        />
      </Switch>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Security Settings</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage your account security and privacy
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Password Change Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                  Current Password
                </label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  id="currentPassword"
                  name="currentPassword"
                  value={passwords.currentPassword}
                  onChange={handlePasswordInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  id="newPassword"
                  name="newPassword"
                  value={passwords.newPassword}
                  onChange={handlePasswordInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                  minLength={8}
                />
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwords.confirmPassword}
                  onChange={handlePasswordInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                  minLength={8}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showPasswords"
                  checked={showPasswords}
                  onChange={(e) => setShowPasswords(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="showPasswords" className="ml-2 block text-sm text-gray-700">
                  Show passwords
                </label>
              </div>

              {passwordError && (
                <div className="text-red-600 text-sm">{passwordError}</div>
              )}

              {passwordSuccess && (
                <div className="text-green-600 text-sm">{passwordSuccess}</div>
              )}

              <button
                type="submit"
                disabled={isChangingPassword}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isChangingPassword ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>

          {/* Two-Factor Authentication Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Two-Factor Authentication</h3>
            <div className="space-y-2">
              <ToggleSwitch
                enabled={settings.twoFactorEnabled}
                onChange={() => handleToggle('twoFactorEnabled')}
                label="Enable Two-Factor Authentication"
                description="Add an extra layer of security to your account"
              />
              
              {settings.twoFactorEnabled && (
                <div className="pl-4 border-l-2 border-gray-100 mt-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Two-factor authentication is enabled. You'll need to enter a code from your authenticator app when logging in.
                  </p>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    View Recovery Codes
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Security Notifications Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Security Notifications</h3>
            <div className="space-y-2">
              <ToggleSwitch
                enabled={settings.loginNotifications}
                onChange={() => handleToggle('loginNotifications')}
                label="Login Notifications"
                description="Get notified when someone logs into your account"
              />
              <ToggleSwitch
                enabled={settings.suspiciousActivity}
                onChange={() => handleToggle('suspiciousActivity')}
                label="Suspicious Activity Alerts"
                description="Get notified about unusual account activity"
              />
            </div>
          </div>

          {/* Data & Privacy Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Data & Privacy</h3>
            <div className="space-y-4">
              <ToggleSwitch
                enabled={settings.dataDownload}
                onChange={() => handleToggle('dataDownload')}
                label="Allow Data Download"
                description="Allow downloading a copy of your data"
              />
              
              <div className="flex flex-col space-y-2">
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium text-left">
                  Download Your Data
                </button>
                <p className="text-sm text-gray-500">
                  Download a copy of all your data including posts, messages, and profile information
                </p>
              </div>
            </div>
          </div>

          {/* Account Management Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Account Management</h3>
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <button className="text-orange-600 hover:text-orange-700 text-sm font-medium text-left">
                  Temporarily Disable Account
                </button>
                <p className="text-sm text-gray-500">
                  Temporarily disable your account. You can reactivate it anytime by logging in.
                </p>
              </div>
              
              <div className="flex flex-col space-y-2">
                <button className="text-red-600 hover:text-red-700 text-sm font-medium text-left">
                  Delete Account
                </button>
                <p className="text-sm text-gray-500">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
              </div>
            </div>
          </div>

          {/* Active Sessions Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Active Sessions</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Current Session</p>
                  <p className="text-sm text-gray-500">
                    {session?.user?.email} • Active now
                  </p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Current
                </span>
              </div>
            </div>
            <button className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All Sessions
            </button>
          </div>
        </div>

        {isSaving && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              <span className="text-sm text-gray-600">Saving...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
