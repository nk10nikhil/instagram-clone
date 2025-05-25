'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Switch } from '@headlessui/react';

export default function PrivacySettings() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState({
    isPrivateAccount: false,
    allowTagging: 'everyone',
    allowMentions: 'everyone',
    allowComments: 'everyone',
    allowDirectMessages: 'everyone',
    showOnlineStatus: true,
    showLastSeen: true,
    showReadReceipts: true,
    allowStoryReplies: true,
    allowStorySharing: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchPrivacySettings();
  }, []);

  const fetchPrivacySettings = async () => {
    try {
      const response = await fetch('/api/settings/privacy');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error fetching privacy settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (newSettings: typeof settings) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/settings/privacy', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });

      if (response.ok) {
        setSettings(newSettings);
      }
    } catch (error) {
      console.error('Error updating privacy settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (key: keyof typeof settings) => {
    const newSettings = {
      ...settings,
      [key]: !settings[key],
    };
    updateSettings(newSettings);
  };

  const handleSelectChange = (key: keyof typeof settings, value: string) => {
    const newSettings = {
      ...settings,
      [key]: value,
    };
    updateSettings(newSettings);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="w-32 h-4 bg-gray-200 rounded"></div>
                <div className="w-48 h-3 bg-gray-200 rounded"></div>
              </div>
              <div className="w-12 h-6 bg-gray-200 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const selectOptions = [
    { value: 'everyone', label: 'Everyone' },
    { value: 'followers', label: 'Followers only' },
    { value: 'no_one', label: 'No one' },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Privacy Settings</h3>
        <p className="text-sm text-gray-600 mt-1">
          Control who can see your content and interact with you
        </p>
      </div>

      <div className="space-y-6">
        {/* Account Privacy */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Private Account</h4>
            <p className="text-sm text-gray-600">
              When your account is private, only people you approve can see your posts
            </p>
          </div>
          <Switch
            checked={settings.isPrivateAccount}
            onChange={() => handleToggle('isPrivateAccount')}
            className={`${
              settings.isPrivateAccount ? 'bg-blue-600' : 'bg-gray-200'
            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
          >
            <span
              className={`${
                settings.isPrivateAccount ? 'translate-x-6' : 'translate-x-1'
              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
          </Switch>
        </div>

        {/* Tagging */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Allow Tagging</h4>
            <p className="text-sm text-gray-600">Who can tag you in posts</p>
          </div>
          <select
            value={settings.allowTagging}
            onChange={(e) => handleSelectChange('allowTagging', e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {selectOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Mentions */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Allow Mentions</h4>
            <p className="text-sm text-gray-600">Who can mention you in posts</p>
          </div>
          <select
            value={settings.allowMentions}
            onChange={(e) => handleSelectChange('allowMentions', e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {selectOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Comments */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Allow Comments</h4>
            <p className="text-sm text-gray-600">Who can comment on your posts</p>
          </div>
          <select
            value={settings.allowComments}
            onChange={(e) => handleSelectChange('allowComments', e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {selectOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Direct Messages */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Allow Direct Messages</h4>
            <p className="text-sm text-gray-600">Who can send you direct messages</p>
          </div>
          <select
            value={settings.allowDirectMessages}
            onChange={(e) => handleSelectChange('allowDirectMessages', e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {selectOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Online Status */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Show Online Status</h4>
            <p className="text-sm text-gray-600">
              Let others see when you're active on Instagram
            </p>
          </div>
          <Switch
            checked={settings.showOnlineStatus}
            onChange={() => handleToggle('showOnlineStatus')}
            className={`${
              settings.showOnlineStatus ? 'bg-blue-600' : 'bg-gray-200'
            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
          >
            <span
              className={`${
                settings.showOnlineStatus ? 'translate-x-6' : 'translate-x-1'
              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
          </Switch>
        </div>

        {/* Read Receipts */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Read Receipts</h4>
            <p className="text-sm text-gray-600">
              Let others see when you've read their messages
            </p>
          </div>
          <Switch
            checked={settings.showReadReceipts}
            onChange={() => handleToggle('showReadReceipts')}
            className={`${
              settings.showReadReceipts ? 'bg-blue-600' : 'bg-gray-200'
            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
          >
            <span
              className={`${
                settings.showReadReceipts ? 'translate-x-6' : 'translate-x-1'
              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
          </Switch>
        </div>

        {/* Story Settings */}
        <div className="border-t border-gray-200 pt-6">
          <h4 className="font-medium text-gray-900 mb-4">Story Settings</h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-medium text-gray-900">Allow Story Replies</h5>
                <p className="text-sm text-gray-600">Let people reply to your stories</p>
              </div>
              <Switch
                checked={settings.allowStoryReplies}
                onChange={() => handleToggle('allowStoryReplies')}
                className={`${
                  settings.allowStoryReplies ? 'bg-blue-600' : 'bg-gray-200'
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
              >
                <span
                  className={`${
                    settings.allowStoryReplies ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </Switch>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-medium text-gray-900">Allow Story Sharing</h5>
                <p className="text-sm text-gray-600">Let people share your stories</p>
              </div>
              <Switch
                checked={settings.allowStorySharing}
                onChange={() => handleToggle('allowStorySharing')}
                className={`${
                  settings.allowStorySharing ? 'bg-blue-600' : 'bg-gray-200'
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
              >
                <span
                  className={`${
                    settings.allowStorySharing ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </Switch>
            </div>
          </div>
        </div>
      </div>

      {isSaving && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
          Saving settings...
        </div>
      )}
    </div>
  );
}
