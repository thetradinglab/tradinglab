import { ReferralDashboard } from './components/ReferralDashboard';
import { Header } from './components/Header';
import { useState } from 'react';
import { Navigate, Route, Routes } from "react-router-dom";
import { AlertCircle} from 'lucide-react';
import { ReferralStats } from './components/ReferralStats';
import { useUserStats } from './lib/web3/hooks';
import TradingUpdates from './components/TradingUpdates';
import { ReferralRegistration } from './components/ReferralRegistration';
import SubPage from './components/SubPage';
import SettingsProp from './components/SettingsProp';
import GetWallet from './components/GetWallet';
import ModulesPage from './components/Modules'
import MyModules from './components/MyModules';
import ModulesViewer from './components/ModuleViewer';
import { modules as initialModules } from './modulesData';
import { ModulesProvider } from './ModuleContext';

function App() {
  const [address, setAddress] = useState<string | null>(null);
  const { stats, error: userStatsError } = useUserStats(address);

  // Block rendering until data is loaded
  //if (userStatsLoading) {
  //  return (
  //    <div className="flex justify-center items-center min-h-screen bg-[#0A1929]">
  //      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
  //    </div>
  //  );
  //}

  // Handle errors
  if (userStatsError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>Error: {userStatsError.message}</span>
          </div>
        </div>
      </div>
    );
  }

  // In your ProtectedRoute component:
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!address) return <Navigate to="/" />;

    if (!stats) return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>No stats found for the current address.</span>
          </div>
        </div>
      </div>
    );

    return <>{children}</>;
  };
  
  return (
    <div className="min-h-screen bg-[#0A1929] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+CiAgPHBhdGggZD0iTTAgMGg2MHY2MEgweiIgZmlsbD0ibm9uZSIvPgogIDxwYXRoIGQ9Ik0zMCAzMG0tMjggMGEyOCAyOCAwIDEgMCA1NiAwYTI4IDI4IDAgMSAwLTU2IDB6IiBzdHJva2U9IiMxMTJBNDUiIGZpbGw9Im5vbmUiLz4KPC9zdmc+')] bg-repeat">
      <main>
        <Header onConnectIsAddress={setAddress} currentAddress={address} />
          <ModulesProvider initialModules={initialModules}>
            <Routes>
              <Route path="/:ref?" element= {<ReferralDashboard stats={stats} address={address} />} />
              <Route path="/register" element= {
                <ProtectedRoute>
                  <ReferralRegistration userAddress={address}/>
                </ProtectedRoute>
                }/>
              <Route path="/subscription" element={
                <ProtectedRoute>
                  <SubPage stats={stats} address={address} />
                </ProtectedRoute>
                }/>
  
              <Route path="/referrals" element= {
                <ProtectedRoute>
                  <ReferralStats stats={stats} address={address}/>
                </ProtectedRoute>
              } />
  
              <Route path="/updates" element= {<TradingUpdates />} /> 
              <Route path="/modules" element= {<ModulesPage/>} />
              <Route path="/module/:moduleId" element ={<ModulesViewer />} />
              <Route path="/my-modules" element={<MyModules />} />
              <Route path="/settings" element= {<SettingsProp stats={stats} address={address}/>} />
              <Route path="/getwallet" element= {<GetWallet stats={stats} address={address}/>} /> 
            </Routes>
          </ModulesProvider>
      </main>
    </div>
  );
}

export default App;
