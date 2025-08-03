
import { Suspense, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Building2, 
  Users, 
  Target, 
  Globe, 
  Settings as SettingsIcon, 
  Search, 
  Plus, 
  Menu,
  Bell,
  ChevronDown,
  UserCircle,
  Phone,
  Mail,
  DollarSign,
  TrendingUp,
  BarChart3,
  FileText
} from 'lucide-react';
import type { 
  Agency, 
  Contact, 
  Deal, 
  LandingPage,
  DealStage
} from '../../server/src/schema';

// Demo data to show the application working while backend is not implemented
const DEMO_AGENCY: Agency = {
  id: 1,
  name: "Digital Solutions Agency",
  subdomain: "digitalsolutions",
  logo_url: null,
  favicon_url: null,
  primary_color: "#0066cc",
  secondary_color: "#666666",
  smtp_host: null,
  smtp_port: null,
  smtp_username: null,
  smtp_password: null,
  custom_domain: null,
  created_at: new Date('2024-01-01'),
  updated_at: new Date()
};

const DEMO_CONTACTS: Contact[] = [
  {
    id: 1,
    agency_id: 1,
    first_name: "John",
    last_name: "Doe",
    email: "john.doe@example.com",
    phone: "+62 812-3456-7890",
    company: "Tech Solutions Ltd",
    position: "CEO",
    tags: ["VIP", "Technology"],
    custom_fields: { budget: "High", source: "Website" },
    created_by: 1,
    created_at: new Date('2024-01-15'),
    updated_at: new Date()
  },
  {
    id: 2,
    agency_id: 1,
    first_name: "Sarah",
    last_name: "Miller",
    email: "sarah@creativestudio.com",
    phone: "+62 811-2345-6789",
    company: "Creative Studio",
    position: "Marketing Director",
    tags: ["Design", "Marketing"],
    custom_fields: { budget: "Medium", source: "Referral" },
    created_by: 1,
    created_at: new Date('2024-01-20'),
    updated_at: new Date()
  },
  {
    id: 3,
    agency_id: 1,
    first_name: "Ahmad",
    last_name: "Rahman",
    email: "ahmad@localstore.id",
    phone: "+62 813-4567-8901",
    company: "Local Store Indonesia",
    position: "Owner",
    tags: ["Retail", "Local"],
    custom_fields: { budget: "Low", source: "Social Media" },
    created_by: 1,
    created_at: new Date('2024-01-25'),
    updated_at: new Date()
  }
];

const DEMO_DEALS: Deal[] = [
  {
    id: 1,
    agency_id: 1,
    contact_id: 1,
    title: "Website Redesign",
    description: "Complete website overhaul for local business",
    value: 15000000,
    stage: 'qualified' as DealStage,
    probability: 75,
    expected_close_date: new Date('2024-02-15'),
    assigned_to: 1,
    created_by: 1,
    created_at: new Date('2024-01-10'),
    updated_at: new Date()
  },
  {
    id: 2,
    agency_id: 1,
    contact_id: 2,
    title: "Social Media Campaign",
    description: "3-month social media marketing campaign",
    value: 8500000,
    stage: 'proposal' as DealStage,
    probability: 60,
    expected_close_date: new Date('2024-01-30'),
    assigned_to: 2,
    created_by: 1,
    created_at: new Date('2024-01-12'),
    updated_at: new Date()
  },
  {
    id: 3,
    agency_id: 1,
    contact_id: 3,
    title: "SEO Optimization",
    description: "Complete SEO audit and optimization",
    value: 5000000,
    stage: 'lead' as DealStage,
    probability: 25,
    expected_close_date: new Date('2024-03-01'),
    assigned_to: 1,
    created_by: 1,
    created_at: new Date('2024-01-14'),
    updated_at: new Date()
  },
  {
    id: 4,
    agency_id: 1,
    contact_id: 1,
    title: "E-commerce Platform",
    description: "Full e-commerce solution with payment integration",
    value: 25000000,
    stage: 'won' as DealStage,
    probability: 100,
    expected_close_date: new Date('2024-01-20'),
    assigned_to: 1,
    created_by: 1,
    created_at: new Date('2024-01-05'),
    updated_at: new Date()
  }
];

const DEMO_PAGES: LandingPage[] = [
  {
    id: 1,
    agency_id: 1,
    title: "Digital Marketing Campaign 2024",
    slug: "digital-marketing-2024",
    template_id: "template-modern",
    content: { hero: "Transform Your Business", cta: "Get Started Today" },
    status: 'published' as const,
    custom_domain: "campaign.digitalsolutions.levelin.com",
    meta_title: "Digital Marketing Services",
    meta_description: "Professional digital marketing services for your business",
    published_at: new Date('2024-01-18'),
    created_by: 1,
    created_at: new Date('2024-01-16'),
    updated_at: new Date()
  },
  {
    id: 2,
    agency_id: 1,
    title: "Lead Generation Form",
    slug: "lead-gen-form",
    template_id: "template-minimal",
    content: { hero: "Grow Your Business", cta: "Contact Us" },
    status: 'draft' as const,
    custom_domain: null,
    meta_title: "Lead Generation",
    meta_description: "Generate quality leads for your business",
    published_at: null,
    created_by: 1,
    created_at: new Date('2024-01-22'),
    updated_at: new Date()
  }
];

// Dashboard Overview Component
function DashboardOverview() {
  const [stats, setStats] = useState({
    totalContacts: 0,
    activeDeals: 0,
    monthlyRevenue: 0,
    conversionRate: 0,
    landingPages: 0,
    interactions: 0
  });

  const [activities, setActivities] = useState<Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    initials: string;
  }>>([]);

  useEffect(() => {
    // Simulate loading with demo data
    const loadDashboardData = () => {
      const contacts = DEMO_CONTACTS;
      const deals = DEMO_DEALS;
      const pages = DEMO_PAGES;

      // Calculate stats from demo data
      const activeDealsCount = deals.filter((deal: Deal) => 
        deal.stage !== 'won' && deal.stage !== 'lost'
      ).length;

      const monthlyRevenue = deals
        .filter((deal: Deal) => deal.stage === 'won')
        .reduce((sum: number, deal: Deal) => sum + (deal.value || 0), 0);

      const conversionRate = deals.length > 0 
        ? (deals.filter((deal: Deal) => deal.stage === 'won').length / deals.length) * 100 
        : 0;

      setStats({
        totalContacts: contacts.length,
        activeDeals: activeDealsCount,
        monthlyRevenue,
        conversionRate: Math.round(conversionRate * 10) / 10,
        landingPages: pages.length,
        interactions: 12 // Demo interaction count
      });

      // Set recent activities based on demo data
      const recentActivities = [
        ...contacts.slice(0, 2).map((contact: Contact) => ({
          id: `contact-${contact.id}`,
          type: 'contact',
          description: `New contact: ${contact.first_name} ${contact.last_name} added`,
          timestamp: contact.created_at.toISOString(),
          initials: `${contact.first_name[0]}${contact.last_name[0]}`
        })),
        ...deals.slice(0, 2).map((deal: Deal) => ({
          id: `deal-${deal.id}`,
          type: 'deal',
          description: `Deal "${deal.title}" updated to ${deal.stage}`,
          timestamp: deal.updated_at.toISOString(),
          initials: 'DL'
        })),
        ...pages.slice(0, 1).map((page: LandingPage) => ({
          id: `page-${page.id}`,
          type: 'page',
          description: `Landing page "${page.title}" ${page.status}`,
          timestamp: page.updated_at.toISOString(),
          initials: 'LP'
        }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setActivities(recentActivities.slice(0, 3));
    };

    loadDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Quick Actions
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalContacts}</div>
            <p className="text-xs text-muted-foreground">Active contacts in system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeDeals}</div>
            <p className="text-xs text-muted-foreground">Deals in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {stats.monthlyRevenue.toLocaleString('id-ID')}</div>
            <p className="text-xs text-muted-foreground">Won deals this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">Deal close rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activities.length > 0 ? activities.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{activity.initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <p className="text-sm">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(activity.timestamp).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Pipeline Overview</CardTitle>
            <CardDescription>Deals by stage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Lead</span>
                <Badge variant="secondary">1</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Qualified</span>
                <Badge variant="secondary">1</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Proposal</span>
                <Badge variant="secondary">1</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Won</span>
                <Badge variant="default">1</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// CRM Monitor Component (Kanban Board)
function CRMMonitor() {
  const deals = DEMO_DEALS;

  const dealsByStage = {
    lead: deals.filter(deal => deal.stage === 'lead'),
    qualified: deals.filter(deal => deal.stage === 'qualified'),
    proposal: deals.filter(deal => deal.stage === 'proposal'),
    won: deals.filter(deal => deal.stage === 'won'),
    lost: deals.filter(deal => deal.stage === 'lost')
  };

  const stageColors = {
    lead: 'bg-gray-100 border-gray-300',
    qualified: 'bg-blue-100 border-blue-300',
    proposal: 'bg-yellow-100 border-yellow-300',
    won: 'bg-green-100 border-green-300',
    lost: 'bg-red-100 border-red-300'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">CRM Monitor</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Deal
        </Button>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-4">
        {Object.entries(dealsByStage).map(([stage, stageDeals]) => (
          <div key={stage} className="min-w-80 flex-shrink-0">
            <div className={`rounded-lg border-2 border-dashed p-4 ${stageColors[stage as DealStage]}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold capitalize">{stage}</h3>
                <Badge variant="secondary">{stageDeals.length}</Badge>
              </div>
              
              <div className="space-y-3">
                {stageDeals.map((deal: Deal) => (
                  <Card key={deal.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{deal.title}</CardTitle>
                      {deal.description && (
                        <CardDescription className="text-xs">{deal.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between text-xs">
                        {deal.value && (
                          <span className="font-medium">
                            Rp {deal.value.toLocaleString('id-ID')}
                          </span>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {deal.probability}%
                        </Badge>
                      </div>
                      {deal.expected_close_date && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Expected: {deal.expected_close_date.toLocaleDateString('id-ID')}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
                
                {stageDeals.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground py-8">
                    No deals in this stage
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Contacts Management Component
function ContactsManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const contacts = DEMO_CONTACTS;

  const filteredContacts = contacts.filter((contact: Contact) => 
    `${contact.first_name} ${contact.last_name} ${contact.email} ${contact.company}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Contacts</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Contact
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredContacts.map((contact: Contact) => (
          <Card key={contact.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {contact.first_name} {contact.last_name}
                  </CardTitle>
                  {contact.position && contact.company && (
                    <CardDescription>
                      {contact.position} at {contact.company}
                    </CardDescription>
                  )}
                </div>
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {contact.first_name[0]}{contact.last_name[0]}
                  </AvatarFallback>
                </Avatar>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {contact.email && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Mail className="mr-2 h-4 w-4" />
                  {contact.email}
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Phone className="mr-2 h-4 w-4" />
                  {contact.phone}
                </div>
              )}
              {contact.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {contact.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredContacts.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {searchQuery ? 'No contacts found matching your search.' : 'No contacts yet. Add your first contact!'}
          </p>
        </div>
      )}
    </div>
  );
}

// Landing Pages Builder Component
function LandingPagesBuilder() {
  const pages = DEMO_PAGES;

  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    published: 'bg-green-100 text-green-800',
    archived: 'bg-red-100 text-red-800'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Landing Pages</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Page
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {pages.map((page: LandingPage) => (
          <Card key={page.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{page.title}</CardTitle>
                  <CardDescription className="mt-1">
                    /{page.slug}
                  </CardDescription>
                </div>
                <Badge 
                  variant="secondary" 
                  className={statusColors[page.status]}
                >
                  {page.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {page.custom_domain && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Globe className="mr-2 h-4 w-4" />
                  {page.custom_domain}
                </div>
              )}
              
              <div className="text-sm">
                <p className="text-muted-foreground">Template:</p>
                <p className="font-medium">{page.template_id}</p>
              </div>

              {page.published_at && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Published:</p>
                  <p>{page.published_at.toLocaleDateString('id-ID')}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  Edit
                </Button>
                {page.status === 'published' && (
                  <Button variant="outline" size="sm">
                    <Globe className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {pages.length === 0 && (
        <div className="text-center py-8">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            No landing pages yet. Create your first page to start capturing leads!
          </p>
        </div>
      )}
    </div>
  );
}

// Settings Component
function AgencySettings({ agency }: { agency: Agency }) {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="domain">Domain</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agency Information</CardTitle>
              <CardDescription>
                Update your agency's basic information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Agency Name</label>
                  <Input defaultValue={agency.name} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subdomain</label>
                  <Input defaultValue={agency.subdomain} />
                </div>
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Brand Customization</CardTitle>
              <CardDescription>
                Customize your agency's visual identity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Primary Color</label>
                  <Input 
                    type="color" 
                    defaultValue={agency.primary_color || '#0066cc'} 
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Secondary Color</label>
                  <Input 
                    type="color" 
                    defaultValue={agency.secondary_color || '#666666'} 
                    className="h-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Logo URL</label>
                <Input 
                  placeholder="https://example.com/logo.png" 
                  defaultValue={agency.logo_url || ''} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Favicon URL</label>
                <Input 
                  placeholder="https://example.com/favicon.ico" 
                  defaultValue={agency.favicon_url || ''} 
                />
              </div>
              <Button>Save Branding</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SMTP Configuration</CardTitle>
              <CardDescription>
                Configure email settings for notifications and campaigns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">SMTP Host</label>
                  <Input 
                    placeholder="smtp.gmail.com" 
                    defaultValue={agency.smtp_host || ''} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">SMTP Port</label>
                  <Input 
                    type="number" 
                    placeholder="587" 
                    defaultValue={agency.smtp_port?.toString() || ''} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Username</label>
                <Input 
                  placeholder="your-email@domain.com" 
                  defaultValue={agency.smtp_username || ''} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                />
              </div>
              <Button>Save Email Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="domain" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Domain</CardTitle>
              <CardDescription>
                Configure your custom domain for white-label experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Custom Domain</label>
                <Input 
                  placeholder="your-agency.com" 
                  defaultValue={agency.custom_domain || ''} 
                />
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Current domain:  <span className="font-medium">{agency.subdomain}.levelin.com</span>
                </p>
              </div>
              <Button>Update Domain</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage team members and their permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <UserCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  User management will be integrated with Clerk authentication
                </p>
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Invite Team Member
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Main App Component
function App() {
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const currentAgency = DEMO_AGENCY;

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
    { id: 'crm', name: 'CRM Monitor', icon: Target },
    { id: 'contacts', name: 'Contacts', icon: Users },
    { id: 'landing-pages', name: 'Landing Pages', icon: Globe },
    { id: 'settings', name: 'Settings', icon: SettingsIcon },
  ];

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'crm':
        return <CRMMonitor />;
      case 'contacts':
        return <ContactsManagement />;
      case 'landing-pages':
        return <LandingPagesBuilder />;
      case 'settings':
        return <AgencySettings agency={currentAgency} />;
      default:
        return <DashboardOverview />;
    }
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo/Brand */}
      <div className="flex h-16 items-center border-b px-4">
        <Building2 className="h-6 w-6 mr-2" style={{ color: currentAgency.primary_color || '#0066cc' }} />
        <span className="font-semibold text-lg">{currentAgency.name}</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                setCurrentView(item.id);
                setSidebarOpen(false);
              }}
              className={`group flex w-full items-center rounded-md px-2 py-2 text-sm font-medium transition-colors ${
                currentView === item.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <Icon className="mr-3 h-5 w-5" />
              {item.name}
            </button>
          );
        })}
      </nav>

      {/* Agency Info */}
      <div className="border-t p-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{currentAgency.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 truncate">
            <p className="text-sm font-medium">{currentAgency.subdomain}.levelin.com</p>
            <p className="text-xs text-muted-foreground">Agency Portal</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-16 items-center border-b px-4 lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden mr-2">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
          </Sheet>

          {/* Global Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts, deals..."
                value={globalSearchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGlobalSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4 ml-4">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="sm">
                <span className="hidden sm:inline">User Account</span>
                <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Suspense 
            fallback={
              <div className="space-y-4">
                <Skeleton className="h-8 w-64" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-32" />
                  ))}
                </div>
              </div>
            }
          >
            {renderContent()}
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default App;
