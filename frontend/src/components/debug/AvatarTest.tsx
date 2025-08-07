// src/components/debug/AvatarTest.tsx
import React from 'react';
import UserAvatar from '@/components/common/UserAvatar';
import { getDiscordAvatarUrl } from '@/utils';

// Тестовые пользователи для проверки аватарок
const testUsers = [
  // Пользователь с аватаром
  {
    id: 1,
    discord_id: "123456789012345678",
    discord_username: "TestUser1",
    discord_discriminator: "0001",
    discord_avatar: "a1b2c3d4e5f6789012345678901234567890",
    minecraft_username: "TestMC1",
    role: "admin" as const,
    is_active: true,
    discord_roles: ["role1", "role2"],
    last_role_check: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Пользователь без аватара (старый дискриминатор)
  {
    id: 2,
    discord_id: "987654321098765432",
    discord_username: "TestUser2",
    discord_discriminator: "1234",
    discord_avatar: null,
    minecraft_username: "TestMC2",
    role: "police" as const,
    is_active: true,
    discord_roles: ["role1"],
    last_role_check: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Пользователь без аватара (новая система)
  {
    id: 3,
    discord_id: "456789012345678901",
    discord_username: "TestUser3",
    discord_discriminator: null,
    discord_avatar: null,
    minecraft_username: "TestMC3",
    role: "citizen" as const,
    is_active: false,
    discord_roles: [],
    last_role_check: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

const AvatarTest: React.FC = () => {
  console.log('=== AVATAR TEST COMPONENT LOADED ===');
  
  return (
    <div className="p-8 space-y-8 bg-dark-900 text-white">
      <h1 className="text-2xl font-bold mb-6">Discord Avatar Test</h1>
      
      {testUsers.map((user) => {
        const avatarUrl = getDiscordAvatarUrl(user);
        
        return (
          <div key={user.id} className="border border-gray-600 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold">
              {user.discord_username} (ID: {user.discord_id})
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* User data */}
              <div>
                <h4 className="font-medium mb-2">User Data:</h4>
                <pre className="text-sm bg-dark-800 p-3 rounded text-gray-300">
                  {JSON.stringify({
                    discord_id: user.discord_id,
                    discord_username: user.discord_username,
                    discord_discriminator: user.discord_discriminator,
                    discord_avatar: user.discord_avatar,
                    role: user.role,
                    is_active: user.is_active
                  }, null, 2)}
                </pre>
              </div>
              
              {/* Generated URL and avatar */}
              <div>
                <h4 className="font-medium mb-2">Generated Avatar URL:</h4>
                <div className="text-sm bg-dark-800 p-3 rounded text-gray-300 mb-3">
                  <a href={avatarUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all">
                    {avatarUrl}
                  </a>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div>
                    <h5 className="text-sm font-medium mb-2">Regular Avatar:</h5>
                    <UserAvatar user={user} size={64} preferDiscord={false} />
                  </div>
                  <div>
                    <h5 className="text-sm font-medium mb-2">Discord Preferred:</h5>
                    <UserAvatar user={user} size={64} preferDiscord={true} />
                  </div>
                  <div>
                    <h5 className="text-sm font-medium mb-2">With Status:</h5>
                    <UserAvatar user={user} size={64} preferDiscord={true} showStatus={true} />
                  </div>
                </div>
                
                {/* Test direct image loading */}
                <div className="mt-4">
                  <h5 className="text-sm font-medium mb-2">Direct Image Test:</h5>
                  <img 
                    src={avatarUrl} 
                    alt="Direct test" 
                    className="w-16 h-16 rounded-full border-2 border-gray-600"
                    onLoad={() => console.log('Direct image loaded:', avatarUrl)}
                    onError={(e) => {
                      console.error('Direct image failed:', avatarUrl, e);
                      const target = e.target as HTMLImageElement;
                      target.style.border = '2px solid red';
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AvatarTest;