import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { useUser, MOCK_USERS } from '@/contexts/UserContext';
import { getRoleLabel, getRoleBadgeColor } from '@/permissions';
import { User, Shield, Eye, Users, Crown } from 'lucide-react';

const roleIcons: Record<string, any> = {
  'ADMIN': Crown,
  'CLIENT_CONTRIBUTOR': User,
  'CONSULTANT': Users,
  'AUDITOR': Shield,
  'VIEWER': Eye,
};

export function DevUserSwitcher() {
  const { setCurrentUser } = useUser();

  const handleSelectUser = (user: typeof MOCK_USERS[0]) => {
    setCurrentUser(user);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0A3B2E] to-[#059669] p-4">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">
            Solvid<span className="text-[#059669]">.IA</span>
          </CardTitle>
          <CardDescription className="text-sm mt-2">
            ESG Audit-Ready Data Room
          </CardDescription>
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>⚙️ Mode Développement</strong> - Sélectionnez un utilisateur test pour tester les permissions RBAC
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {MOCK_USERS.map((user) => {
            const RoleIcon = roleIcons[user.role] || User;
            const badgeColor = getRoleBadgeColor(user.role);
            
            return (
              <button
                key={user.id}
                onClick={() => handleSelectUser(user)}
                className="w-full p-4 border-2 border-border rounded-lg hover:border-[#059669] hover:bg-accent/50 transition-all text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#059669] to-[#0A3B2E] rounded-full flex items-center justify-center text-white text-xl flex-shrink-0">
                    {user.avatar || user.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-foreground group-hover:text-[#059669] transition-colors">
                        {user.name}
                      </p>
                      <RoleIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={`${badgeColor} text-white text-xs`}>
                      {getRoleLabel(user.role)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {user.organizationName}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
          
          <div className="mt-6 pt-6 border-t">
            <p className="text-xs text-center text-muted-foreground">
              <strong>Note :</strong> En production, l'authentification sera gérée par Supabase Auth avec email/password ou magic link.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
