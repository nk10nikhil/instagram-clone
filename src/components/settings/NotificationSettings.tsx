'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Switch } from '@headlessui/react';

export default function NotificationSettings() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState({
    // Push notifications
    pushNotifications: true,
    likes: true,
    comments: true,
    follows: true,
    mentions: true,
    directMessages: true,
    stories: true,
    
    // Email notifications
    emailNotifications: true,
    emailLikes: false,
    emailComments: true,
    emailFollows: true,
    emailMentions: true,
    emailDirectMessages: true,
    emailWeeklyDigest: true,
    
    // In-app notifications
    inAppNotifications: true,
    soundEnabled: true,
    vibrationEnabled: true,
    
    // Activity notifications
    activityStatus: true,
    onlineStatus: true,
    readReceipts: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchNotificationSettings();
  }, []);

  const fetchNotificationSettings = async () => {
    try {
      const response = await fetch('/api/settings/notifications');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (newSettings: typeof settings) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });

      if (response.ok) {
        setSettings(newSettings);
      } else {
        console.error('Failed to update notification settings');
      }
    } catch (error) {
      console.error('Error updating notification settings:', error);
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
          <h2 className="text-lg font-medium text-gray-900">Notification Settings</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage your notification preferences
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Push Notifications Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Push Notifications</h3>
            <div className="space-y-2">
              <ToggleSwitch
                enabled={settings.pushNotifications}
                onChange={() => handleToggle('pushNotifications')}
                label="Enable Push Notifications"
                description="Receive notifications on your device"
              />
              
              {settings.pushNotifications && (
                <div className="pl-4 space-y-2 border-l-2 border-gray-100">
                  <ToggleSwitch
                    enabled={settings.likes}
                    onChange={() => handleToggle('likes')}
                    label="Likes"
                    description="When someone likes your posts"
                  />
                  <ToggleSwitch
                    enabled={settings.comments}
                    onChange={() => handleToggle('comments')}
                    label="Comments"
                    description="When someone comments on your posts"
                  />
                  <ToggleSwitch
                    enabled={settings.follows}
                    onChange={() => handleToggle('follows')}
                    label="New Followers"
                    description="When someone follows you"
                  />
                  <ToggleSwitch
                    enabled={settings.mentions}
                    onChange={() => handleToggle('mentions')}
                    label="Mentions"
                    description="When someone mentions you"
                  />
                  <ToggleSwitch
                    enabled={settings.directMessages}
                    onChange={() => handleToggle('directMessages')}
                    label="Direct Messages"
                    description="When you receive a new message"
                  />
                  <ToggleSwitch
                    enabled={settings.stories}
                    onChange={() => handleToggle('stories')}
                    label="Stories"
                    description="When someone you follow posts a story"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Email Notifications Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Email Notifications</h3>
            <div className="space-y-2">
              <ToggleSwitch
                enabled={settings.emailNotifications}
                onChange={() => handleToggle('emailNotifications')}
                label="Enable Email Notifications"
                description="Receive notifications via email"
              />
              
              {settings.emailNotifications && (
                <div className="pl-4 space-y-2 border-l-2 border-gray-100">
                  <ToggleSwitch
                    enabled={settings.emailLikes}
                    onChange={() => handleToggle('emailLikes')}
                    label="Likes"
                    description="Email when someone likes your posts"
                  />
                  <ToggleSwitch
                    enabled={settings.emailComments}
                    onChange={() => handleToggle('emailComments')}
                    label="Comments"
                    description="Email when someone comments on your posts"
                  />
                  <ToggleSwitch
                    enabled={settings.emailFollows}
                    onChange={() => handleToggle('emailFollows')}
                    label="New Followers"
                    description="Email when someone follows you"
                  />
                  <ToggleSwitch
                    enabled={settings.emailMentions}
                    onChange={() => handleToggle('emailMentions')}
                    label="Mentions"
                    description="Email when someone mentions you"
                  />
                  <ToggleSwitch
                    enabled={settings.emailDirectMessages}
                    onChange={() => handleToggle('emailDirectMessages')}
                    label="Direct Messages"
                    description="Email when you receive a new message"
                  />
                  <ToggleSwitch
                    enabled={settings.emailWeeklyDigest}
                    onChange={() => handleToggle('emailWeeklyDigest')}
                    label="Weekly Digest"
                    description="Weekly summary of your activity"
                  />
                </div>
              )}
            </div>
          </div>

          {/* In-App Notifications Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">In-App Settings</h3>
            <div className="space-y-2">
              <ToggleSwitch
                enabled={settings.inAppNotifications}
                onChange={() => handleToggle('inAppNotifications')}
                label="In-App Notifications"
                description="Show notifications within the app"
              />
              <ToggleSwitch
                enabled={settings.soundEnabled}
                onChange={() => handleToggle('soundEnabled')}
                label="Sound"
                description="Play notification sounds"
              />
              <ToggleSwitch
                enabled={settings.vibrationEnabled}
                onChange={() => handleToggle('vibrationEnabled')}
                label="Vibration"
                description="Vibrate on notifications"
              />
            </div>
          </div>

          {/* Activity Status Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Activity Status</h3>
            <div className="space-y-2">
              <ToggleSwitch
                enabled={settings.activityStatus}
                onChange={() => handleToggle('activityStatus')}
                label="Activity Status"
                description="Let others see when you're active"
              />
              <ToggleSwitch
                enabled={settings.onlineStatus}
                onChange={() => handleToggle('onlineStatus')}
                label="Online Status"
                description="Show when you're online"
              />
              <ToggleSwitch
                enabled={settings.readReceipts}
                onChange={() => handleToggle('readReceipts')}
                label="Read Receipts"
                description="Let others know when you've read their messages"
              />
            </div>
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
