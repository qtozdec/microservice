import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { twoFactorService } from '../services/twoFactorService';
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  Key,
  Smartphone,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';

const TwoFactorAuth = () => {
  const { user, updateUser } = useAuth();
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    if (user?.twoFactorEnabled) {
      fetchBackupCodes();
    }
  }, [user?.twoFactorEnabled]);

  const fetchBackupCodes = async () => {
    try {
      const codes = await twoFactorService.getBackupCodes(user.userId);
      setBackupCodes(codes);
    } catch (error) {
      console.error('Error fetching backup codes:', error);
    }
  };

  const setupTwoFactor = async () => {
    setLoading(true);
    try {
      const setupData = await twoFactorService.setup(user.userId);
      console.log('2FA setup response:', setupData);
      setQrCode(setupData.qrCode);
      setSecret(setupData.secret);
      setBackupCodes(setupData.backupCodes);
    } catch (error) {
      toast.error('Failed to setup 2FA. Please try again.');
      console.error('2FA setup error:', error);
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    try {
      await twoFactorService.verify(user.userId, verificationCode);
      updateUser({ ...user, twoFactorEnabled: true });
      setShowBackupCodes(true);
      toast.success('2FA enabled successfully!');
      setVerificationCode('');
    } catch (error) {
      toast.error('Invalid verification code. Please try again.');
      console.error('2FA verification error:', error);
    } finally {
      setLoading(false);
    }
  };

  const disableTwoFactor = async () => {
    if (!window.confirm('Are you sure you want to disable 2FA? This will reduce your account security.')) {
      return;
    }

    setLoading(true);
    try {
      await twoFactorService.disable(user.userId);
      updateUser({ ...user, twoFactorEnabled: false });
      setQrCode('');
      setSecret('');
      setBackupCodes([]);
      setShowBackupCodes(false);
      toast.success('2FA disabled successfully');
    } catch (error) {
      toast.error('Failed to disable 2FA. Please try again.');
      console.error('2FA disable error:', error);
    } finally {
      setLoading(false);
    }
  };

  const regenerateBackupCodes = async () => {
    if (!window.confirm('Generate new backup codes? This will invalidate existing codes.')) {
      return;
    }

    setLoading(true);
    try {
      const newCodes = await twoFactorService.regenerateBackupCodes(user.userId);
      setBackupCodes(newCodes);
      setShowBackupCodes(true);
      toast.success('New backup codes generated');
    } catch (error) {
      toast.error('Failed to generate backup codes');
      console.error('Backup codes error:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'secret') {
        setCopiedSecret(true);
        setTimeout(() => setCopiedSecret(false), 2000);
      } else {
        setCopiedCode(text);
        setTimeout(() => setCopiedCode(null), 2000);
      }
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const downloadBackupCodes = () => {
    const content = `Two-Factor Authentication Backup Codes
Generated: ${new Date().toLocaleString()}
Account: ${user.email}

IMPORTANT: Save these codes in a secure location. Each code can only be used once.

${backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n')}

Instructions:
- Use these codes if you lose access to your authenticator app
- Each code can only be used once
- Generate new codes if you use all of them
- Keep these codes secure and private`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `2fa-backup-codes-${user.email}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!user?.twoFactorEnabled && !qrCode) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Shield className="h-6 w-6 text-gray-400" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Two-Factor Authentication
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Add an extra layer of security to your account
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <ShieldOff className="h-5 w-5 text-red-500" />
            <span className="text-sm font-medium text-red-600 dark:text-red-400">Disabled</span>
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Enhance Your Security
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Enable 2FA to protect your account with an additional authentication step using your mobile device.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
            <Smartphone className="h-4 w-4" />
            <span>Compatible with Google Authenticator, Authy, and other TOTP apps</span>
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
            <Key className="h-4 w-4" />
            <span>Backup codes provided for account recovery</span>
          </div>
        </div>

        <button
          onClick={setupTwoFactor}
          disabled={loading}
          className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              Setting up...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4 mr-2" />
              Enable Two-Factor Authentication
            </>
          )}
        </button>
      </div>
    );
  }

  if (qrCode && !user?.twoFactorEnabled) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center mb-6">
          <Shield className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Setup Two-Factor Authentication
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Scan the QR code with your authenticator app
          </p>
        </div>

        <div className="space-y-6">
          <div className="text-center">
            <div className="bg-white p-4 rounded-lg inline-block shadow-sm border">
              <img src={qrCode} alt="QR Code" className="mx-auto" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Manual Entry Key
            </label>
            <div className="flex items-center space-x-2">
              <code className="flex-1 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg text-sm font-mono break-all">
                {secret}
              </code>
              <button
                onClick={() => copyToClipboard(secret, 'secret')}
                className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                title="Copy secret"
              >
                {copiedSecret ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Verification Code
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit code"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
              maxLength={6}
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={verifyAndEnable}
              disabled={loading || verificationCode.length !== 6}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Verifying...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Verify & Enable
                </>
              )}
            </button>
            <button
              onClick={() => {
                setQrCode('');
                setSecret('');
                setVerificationCode('');
              }}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ShieldCheck className="h-6 w-6 text-green-500" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Two-Factor Authentication
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Your account is protected with 2FA
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium text-green-600 dark:text-green-400">Enabled</span>
          </div>
        </div>

        <div className="mt-6 flex space-x-3">
          <button
            onClick={regenerateBackupCodes}
            disabled={loading}
            className="flex items-center px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerate Backup Codes
          </button>
          <button
            onClick={() => setShowBackupCodes(!showBackupCodes)}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
          >
            <Key className="h-4 w-4 mr-2" />
            {showBackupCodes ? 'Hide' : 'Show'} Backup Codes
          </button>
          <button
            onClick={disableTwoFactor}
            disabled={loading}
            className="flex items-center px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <ShieldOff className="h-4 w-4 mr-2" />
            Disable 2FA
          </button>
        </div>
      </div>

      {/* Backup Codes */}
      {showBackupCodes && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Key className="h-5 w-5 text-gray-400" />
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Backup Codes</h4>
            </div>
            <button
              onClick={downloadBackupCodes}
              className="flex items-center px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200"
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </button>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800 dark:text-yellow-200">Important:</p>
                <ul className="text-yellow-700 dark:text-yellow-300 mt-1 space-y-1">
                  <li>• Save these codes in a secure location</li>
                  <li>• Each code can only be used once</li>
                  <li>• Use them if you lose access to your authenticator app</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {backupCodes.map((code, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg"
              >
                <code className="text-sm font-mono">{code}</code>
                <button
                  onClick={() => copyToClipboard(code)}
                  className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                  title="Copy code"
                >
                  {copiedCode === code ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TwoFactorAuth;