import React, { useEffect, useState, useCallback } from 'react';
import {
  Building2,
  CalendarCheck,
  Check,
  Clock,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  MessageSquareQuote,
  Phone,
  Plus,
  Settings,
  Star,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import {
  BookingRequest,
  BookingStatus,
  Guest,
  Property,
  Review,
  SiteSettings,
} from '../../types';
import { apiFetch, getAdminToken, setAdminToken } from '../../lib/supabase/client';
import { useRafiki } from '../../context/RafikiContext';
import {
  formatKES,
  formatLongDate,
  formatShortDate,
} from '../../lib/bookings/validation';
import {
  buildWhatsAppUrl,
  formatDisplayPhone,
  normalizeTelLink,
  WhatsAppMessages,
} from '../../lib/whatsapp';
import { AVAILABLE_AMENITIES } from '../../lib/supabase/seed-data';
import { ResilientImage } from '../../components/ui/ResilientImage';
import { PropertyPhotosManager } from '../../components/admin/PropertyPhotosManager';

type AdminTab =
  | 'dashboard'
  | 'properties'
  | 'bookings'
  | 'confirmed'
  | 'guests'
  | 'reviews'
  | 'settings';

interface AdminOverviewResponse {
  properties: Property[];
  bookings: BookingRequest[];
  guests: Guest[];
  reviews: Review[];
  settings: SiteSettings;
}

export const AdminDashboardPage: React.FC<{ initialSubRoute?: string }> = ({
  initialSubRoute = 'dashboard',
}) => {
  const { navigate, refreshPublicData } = useRafiki();

  const resolveTabFromRoute = (sub: string): AdminTab => {
    if (sub === 'properties') return 'properties';
    if (sub === 'bookings') return 'bookings';
    if (sub === 'confirmed') return 'confirmed';
    if (sub === 'guests') return 'guests';
    if (sub === 'reviews') return 'reviews';
    if (sub === 'settings') return 'settings';
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState<AdminTab>(() =>
    resolveTabFromRoute(initialSubRoute)
  );

  useEffect(() => {
    setActiveTab(resolveTabFromRoute(initialSubRoute));
  }, [initialSubRoute]);

  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [bannerMessage, setBannerMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [selectedBooking, setSelectedBooking] = useState<BookingRequest | null>(null);
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>('all');
  const [adminNotesDraft, setAdminNotesDraft] = useState<string>('');
  const [bookingActionLoading, setBookingActionLoading] = useState(false);

  const [editingProperty, setEditingProperty] = useState<Partial<Property> | null>(null);
  const [deletingPropertyId, setDeletingPropertyId] = useState<string | null>(null);
  const [propertySaving, setPropertySaving] = useState(false);

  const [editingReview, setEditingReview] = useState<Partial<Review> | null>(null);
  const [reviewSaving, setReviewSaving] = useState(false);

  const [settingsForm, setSettingsForm] = useState<SiteSettings>({
    whatsapp_number: '254712345678',
    phone_number: '+254 712 345 678',
    support_email: 'karibu@rafikiliving.com',
    office_address: 'Argwings Kodhek Road, Kilimani, Nairobi, Kenya',
    company_tagline: 'Where Every Stay Feels Like Home.',
  });
  const [settingsSaving, setSettingsSaving] = useState(false);

  const loadAdminData = useCallback(async () => {
    const token = getAdminToken();
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      const data = await apiFetch<AdminOverviewResponse>(
        '/api/admin/overview',
        {},
        true
      );
      setProperties(data.properties);
      setBookings(data.bookings);
      setGuests(data.guests);
      setReviews(data.reviews);
      setSettings(data.settings);
      setSettingsForm(data.settings);
    } catch {
      setAdminToken(null);
      navigate('/admin/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const switchTab = (tab: AdminTab) => {
    setActiveTab(tab);
    setBannerMessage(null);
    navigate(`/admin/${tab}`);
  };

  const handleLogout = () => {
    setAdminToken(null);
    navigate('/admin/login');
  };

  const openBookingDetail = (booking: BookingRequest) => {
    setSelectedBooking(booking);
    setAdminNotesDraft(booking.admin_notes || '');
    setBannerMessage(null);
  };

  const handleUpdateBookingStatus = async (
    bookingId: string,
    nextStatus: BookingStatus,
    notesOverride?: string
  ) => {
    setBookingActionLoading(true);
    setBannerMessage(null);
    try {
      const res = await apiFetch<{ booking: BookingRequest }>(
        `/api/admin/bookings/${bookingId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            status: nextStatus,
            admin_notes: notesOverride !== undefined ? notesOverride : adminNotesDraft,
          }),
        },
        true
      );

      setSelectedBooking(res.booking);
      await loadAdminData();
      await refreshPublicData();
      setBannerMessage({
        type: 'success',
        text: `Booking ${res.booking.reference_number} updated to "${nextStatus.toUpperCase()}".`,
      });
    } catch (err) {
      setBannerMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Could not update booking status.',
      });
    } finally {
      setBookingActionLoading(false);
    }
  };

  const handleSaveProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProperty) return;
    setPropertySaving(true);
    setBannerMessage(null);

    try {
      if (editingProperty.id) {
        await apiFetch(
          `/api/admin/properties/${editingProperty.id}`,
          { method: 'PUT', body: JSON.stringify(editingProperty) },
          true
        );
      } else {
        await apiFetch(
          '/api/admin/properties',
          { method: 'POST', body: JSON.stringify(editingProperty) },
          true
        );
      }

      setEditingProperty(null);
      await loadAdminData();
      await refreshPublicData();
      setBannerMessage({ type: 'success', text: 'Property saved successfully.' });
    } catch (err) {
      setBannerMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to save property.',
      });
    } finally {
      setPropertySaving(false);
    }
  };

  const handleTogglePropertyPublish = async (prop: Property) => {
    try {
      await apiFetch(
        `/api/admin/properties/${prop.id}`,
        { method: 'PUT', body: JSON.stringify({ published: !prop.published }) },
        true
      );
      await loadAdminData();
      await refreshPublicData();
    } catch (err) {
      setBannerMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to toggle publish status.',
      });
    }
  };

  const handleConfirmDeleteProperty = async (propId: string) => {
    try {
      await apiFetch(`/api/admin/properties/${propId}`, { method: 'DELETE' }, true);
      setDeletingPropertyId(null);
      await loadAdminData();
      await refreshPublicData();
      setBannerMessage({ type: 'success', text: 'Property deleted.' });
    } catch (err) {
      setDeletingPropertyId(null);
      setBannerMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Could not delete property.',
      });
    }
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview) return;
    setReviewSaving(true);
    setBannerMessage(null);

    try {
      if (editingReview.id) {
        await apiFetch(
          `/api/admin/reviews/${editingReview.id}`,
          { method: 'PUT', body: JSON.stringify(editingReview) },
          true
        );
      } else {
        await apiFetch(
          '/api/admin/reviews',
          { method: 'POST', body: JSON.stringify(editingReview) },
          true
        );
      }

      setEditingReview(null);
      await loadAdminData();
      await refreshPublicData();
      setBannerMessage({ type: 'success', text: 'Review saved.' });
    } catch (err) {
      setBannerMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to save review.',
      });
    } finally {
      setReviewSaving(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await apiFetch(`/api/admin/reviews/${reviewId}`, { method: 'DELETE' }, true);
      await loadAdminData();
      await refreshPublicData();
    } catch (err) {
      setBannerMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to delete review.',
      });
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    setBannerMessage(null);
    try {
      const res = await apiFetch<{ settings: SiteSettings }>(
        '/api/admin/settings',
        { method: 'PUT', body: JSON.stringify(settingsForm) },
        true
      );
      setSettings(res.settings);
      setSettingsForm(res.settings);
      await refreshPublicData();
      setBannerMessage({
        type: 'success',
        text: 'Contact settings saved. WhatsApp & phone links updated across the site.',
      });
    } catch (err) {
      setBannerMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Could not save settings.',
      });
    } finally {
      setSettingsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] p-8 flex items-center justify-center">
        <p className="text-sm text-[#5C5F58]">Loading MIS Stays Admin Console...</p>
      </div>
    );
  }

  const pendingRequestsCount = bookings.filter((b) => b.status === 'pending').length;
  const confirmedBookingsList = bookings.filter((b) => b.status === 'confirmed');
  const upcomingCheckInsCount = confirmedBookingsList.filter((b) => b.check_in >= '2026-10-08').length;

  const sidebarItems: { id: AdminTab; label: string; Icon: typeof LayoutDashboard; count?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    { id: 'properties', label: 'Properties', Icon: Building2, count: properties.length },
    { id: 'bookings', label: 'Booking Requests', Icon: Clock, count: pendingRequestsCount },
    { id: 'confirmed', label: 'Confirmed Bookings', Icon: CalendarCheck, count: confirmedBookingsList.length },
    { id: 'guests', label: 'Guests', Icon: Users, count: guests.length },
    { id: 'reviews', label: 'Reviews', Icon: MessageSquareQuote, count: reviews.length },
    { id: 'settings', label: 'Settings', Icon: Settings },
  ];

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'confirmed') return b.status === 'confirmed';
    if (bookingStatusFilter === 'all') return true;
    return b.status === bookingStatusFilter;
  });

  return (
    <div className="min-h-screen bg-[#FBF9F5] flex flex-col lg:flex-row">
      <aside className="w-full lg:w-64 bg-[#1A1D1B] text-[#FBF9F5] shrink-0 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10">
        <div className="p-5 space-y-6">
          <div className="flex items-center justify-between">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                navigate('/');
              }}
              className="font-serif text-2xl font-semibold tracking-tight text-white"
            >
              MIS Stays
            </a>
            <span className="text-[11px] font-mono-num text-[#B89758]">Admin</span>
          </div>

          <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
            {sidebarItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedBooking(null);
                    setEditingProperty(null);
                    switchTab(item.id);
                  }}
                  className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#2C4C3E] text-white font-semibold'
                      : 'text-[#D6D3CD] hover:bg-white/8 hover:text-white'
                  }`}
                >
                  <span className="inline-flex items-center gap-2.5">
                    <item.Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </span>
                  {item.count !== undefined && (
                    <span className="font-mono-num text-[11px] opacity-80">{item.count}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="hidden lg:flex flex-col p-5 border-t border-white/10 space-y-3 text-xs">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
            }}
            className="inline-flex items-center gap-2 text-[#D6D3CD] hover:text-white transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View Public Website</span>
          </a>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 text-[#F87171] hover:text-[#FCA5A5] transition-colors text-left cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 px-6 border-b border-[#1A1D1B]/10 bg-[#FBF9F5] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-[#5C5F58]">
            <span>MIS Stays</span>
            <span>/</span>
            <strong className="text-[#1A1D1B] capitalize">{activeTab}</strong>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                navigate('/');
              }}
              className="px-3 py-1.5 rounded-lg border border-[#1A1D1B]/15 text-xs font-medium text-[#1A1D1B] hover:bg-[#F2EFE9] transition-colors whitespace-nowrap"
            >
              Public Website
            </a>
            <button
              type="button"
              onClick={handleLogout}
              className="lg:hidden px-3 py-1.5 rounded-lg bg-[#1A1D1B] text-white text-xs font-medium cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </header>

        <main className="p-6 sm:p-8 max-w-6xl w-full mx-auto space-y-8">
          {bannerMessage && (
            <div
              className={`p-4 rounded-xl border flex items-center justify-between gap-4 text-xs font-medium ${
                bannerMessage.type === 'success'
                  ? 'bg-[#F0FDF4] border-[#16A34A]/30 text-[#166534]'
                  : 'bg-[#FEF2F2] border-[#DC2626]/30 text-[#991B1B]'
              }`}
            >
              <span>{bannerMessage.text}</span>
              <button
                type="button"
                onClick={() => setBannerMessage(null)}
                className="p-1 hover:opacity-75 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              <div>
                <h1 className="font-serif text-3xl font-semibold text-[#1A1D1B]">
                  Hospitality Overview
                </h1>
                <p className="text-sm text-[#5C5F58]">
                  Real-time summary of properties, pending requests, and confirmed bookings.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-xl bg-[#F2EFE9] border border-[#1A1D1B]/10 space-y-1">
                  <span className="text-xs text-[#5C5F58]">Total Properties</span>
                  <p className="text-3xl font-semibold text-[#1A1D1B] font-mono-num">{properties.length}</p>
                  <span className="text-xs text-[#2C4C3E]">{properties.filter((p) => p.published).length} published live</span>
                </div>

                <div className="p-5 rounded-xl bg-[#F2EFE9] border border-[#1A1D1B]/10 space-y-1">
                  <span className="text-xs text-[#5C5F58]">Pending Requests</span>
                  <p className="text-3xl font-semibold text-[#B45309] font-mono-num">{pendingRequestsCount}</p>
                  <span className="text-xs text-[#5C5F58]">Awaiting WhatsApp contact</span>
                </div>

                <div className="p-5 rounded-xl bg-[#F2EFE9] border border-[#1A1D1B]/10 space-y-1">
                  <span className="text-xs text-[#5C5F58]">Confirmed Bookings</span>
                  <p className="text-3xl font-semibold text-[#16A34A] font-mono-num">{confirmedBookingsList.length}</p>
                  <span className="text-xs text-[#5C5F58]">Locked against overlap</span>
                </div>

                <div className="p-5 rounded-xl bg-[#F2EFE9] border border-[#1A1D1B]/10 space-y-1">
                  <span className="text-xs text-[#5C5F58]">Upcoming Check-ins</span>
                  <p className="text-3xl font-semibold text-[#1A1D1B] font-mono-num">{upcomingCheckInsCount}</p>
                  <span className="text-xs text-[#5C5F58]">Upcoming arrivals</span>
                </div>
              </div>

              <div className="rounded-xl bg-[#FBF9F5] border border-[#1A1D1B]/12 overflow-hidden">
                <div className="px-6 py-4 bg-[#F2EFE9] border-b border-[#1A1D1B]/10 flex items-center justify-between">
                  <h2 className="font-serif text-xl font-semibold text-[#1A1D1B]">Recent booking requests</h2>
                  <button
                    type="button"
                    onClick={() => switchTab('bookings')}
                    className="text-xs font-semibold text-[#2C4C3E] hover:underline cursor-pointer"
                  >
                    View all ({bookings.length})
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-[#1A1D1B]/10 text-xs text-[#5C5F58]">
                        <th className="py-3 px-4 font-medium">Reference</th>
                        <th className="py-3 px-4 font-medium">Guest</th>
                        <th className="py-3 px-4 font-medium">Property</th>
                        <th className="py-3 px-4 font-medium">Dates</th>
                        <th className="py-3 px-4 font-medium">Guests</th>
                        <th className="py-3 px-4 font-medium">Status</th>
                        <th className="py-3 px-4 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1A1D1B]/8">
                      {bookings.slice(0, 8).map((b) => (
                        <tr key={b.id} className="hover:bg-[#F2EFE9]/50 transition-colors">
                          <td className="py-3.5 px-4 font-mono-num text-xs font-medium text-[#1A1D1B]">
                            {b.reference_number}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-[#1A1D1B]">{b.guest_name}</div>
                            <div className="text-xs text-[#5C5F58] font-mono-num">{b.guest_phone}</div>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-[#1A1D1B]">{b.property_name}</td>
                          <td className="py-3.5 px-4 tabular-nums text-xs text-[#4A4E48]">
                            {formatShortDate(b.check_in)} → {formatShortDate(b.check_out)}
                          </td>
                          <td className="py-3.5 px-4 tabular-nums text-xs text-[#4A4E48]">{b.guests_count} guests</td>
                          <td className="py-3.5 px-4 text-xs font-semibold capitalize">{b.status}</td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                switchTab('bookings');
                                openBookingDetail(b);
                              }}
                              className="px-3 py-1.5 rounded-md bg-[#F2EFE9] hover:bg-[#2C4C3E] hover:text-white text-xs font-semibold text-[#1A1D1B] transition-colors cursor-pointer"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {(activeTab === 'bookings' || activeTab === 'confirmed') && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="font-serif text-3xl font-semibold text-[#1A1D1B]">
                  {activeTab === 'confirmed' ? 'Confirmed Bookings' : 'Booking Requests'}
                </h1>
              </div>

              {selectedBooking && (
                <div className="rounded-xl bg-[#F2EFE9] border border-[#1A1D1B]/15 p-6 space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono-num text-xs font-semibold px-2.5 py-1 rounded bg-[#FBF9F5] border border-[#1A1D1B]/12">
                        {selectedBooking.reference_number}
                      </span>
                      <h2 className="font-serif text-2xl font-semibold text-[#1A1D1B] pt-2">
                        {selectedBooking.guest_name} · {selectedBooking.property_name}
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedBooking(null)}
                      className="text-xs text-[#5C5F58] hover:text-[#1A1D1B] cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="pt-4 border-t border-[#1A1D1B]/10 flex flex-wrap gap-2.5">
                    <a
                      href={buildWhatsAppUrl(
                        selectedBooking.guest_phone,
                        WhatsAppMessages.adminToGuestReply(
                          selectedBooking.guest_name,
                          selectedBooking.property_name,
                          formatLongDate(selectedBooking.check_in),
                          formatLongDate(selectedBooking.check_out),
                          selectedBooking.reference_number
                        )
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#2C4C3E] text-white text-xs font-semibold"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>WhatsApp Guest</span>
                    </a>

                    <a
                      href={normalizeTelLink(selectedBooking.guest_phone)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#FBF9F5] border border-[#1A1D1B]/20 text-xs font-semibold text-[#1A1D1B]"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Call Guest</span>
                    </a>

                    {selectedBooking.status !== 'confirmed' && (
                      <button
                        type="button"
                        disabled={bookingActionLoading}
                        onClick={() => handleUpdateBookingStatus(selectedBooking.id, 'confirmed')}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#16A34A] text-white text-xs font-semibold cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Confirm Booking</span>
                      </button>
                    )}

                    {selectedBooking.status !== 'cancelled' && (
                      <button
                        type="button"
                        disabled={bookingActionLoading}
                        onClick={() => handleUpdateBookingStatus(selectedBooking.id, 'cancelled')}
                        className="px-4 py-2.5 rounded-lg bg-[#FEF2F2] border border-[#DC2626]/30 text-[#991B1B] text-xs font-semibold cursor-pointer"
                      >
                        Cancel Request
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="rounded-xl bg-[#FBF9F5] border border-[#1A1D1B]/12 overflow-hidden">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#F2EFE9] border-b border-[#1A1D1B]/10 text-xs text-[#5C5F58]">
                      <th className="py-3 px-4">Reference</th>
                      <th className="py-3 px-4">Guest</th>
                      <th className="py-3 px-4">Property</th>
                      <th className="py-3 px-4">Dates</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A1D1B]/8">
                    {filteredBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-[#F2EFE9]/60">
                        <td className="py-3.5 px-4 font-mono-num text-xs font-semibold text-[#1A1D1B]">
                          {b.reference_number}
                        </td>
                        <td className="py-3.5 px-4">{b.guest_name}</td>
                        <td className="py-3.5 px-4">{b.property_name}</td>
                        <td className="py-3.5 px-4 text-xs tabular-nums">
                          {formatShortDate(b.check_in)} → {formatShortDate(b.check_out)}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-semibold capitalize">{b.status}</td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => openBookingDetail(b)}
                            className="px-3 py-1.5 rounded-md bg-[#F2EFE9] text-xs font-semibold cursor-pointer"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'properties' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="font-serif text-3xl font-semibold text-[#1A1D1B]">Properties Management</h1>
                  <p className="text-sm text-[#5C5F58]">Create, edit, publish, and manage your stays.</p>
                </div>
                {!editingProperty && (
                  <button
                    type="button"
                    onClick={() =>
                      setEditingProperty({
                        name: '',
                        slug: '',
                        description: '',
                        neighborhood_overview: '',
                        location: 'Kilimani',
                        city: 'Nairobi',
                        country: 'Kenya',
                        price_per_night: 8500,
                        max_guests: 4,
                        bedrooms: 2,
                        beds: 2,
                        bathrooms: 2,
                        property_type: 'Boutique Apartment',
                        amenities: [
                          'High-Speed Fiber Wi-Fi',
                          'Dedicated Workspace',
                          'Free Secure Parking',
                          'Fully Equipped Kitchen',
                          '24/7 Manned Security & CCTV',
                          'Full Backup Power Generator',
                        ],
                        house_rules: {
                          smoking: 'No smoking inside the residence',
                          pets: 'Pets are not permitted',
                          parties: 'No parties or events allowed',
                        },
                        check_in_time: '2:00 PM',
                        check_out_time: '11:00 AM',
                        featured: true,
                        published: true,
                        is_demo: false,
                        images: [],
                      })
                    }
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#2C4C3E] text-white text-xs font-semibold hover:bg-[#223B30] transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Property</span>
                  </button>
                )}
              </div>

              {editingProperty && (
                <form
                  onSubmit={handleSaveProperty}
                  className="rounded-xl bg-[#F2EFE9] border border-[#1A1D1B]/15 p-6 sm:p-8 space-y-6"
                >
                  <div className="flex items-center justify-between border-b border-[#1A1D1B]/10 pb-3">
                    <h2 className="font-serif text-2xl font-semibold text-[#1A1D1B]">
                      {editingProperty.id ? `Edit: ${editingProperty.name}` : 'Create New Residence'}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setEditingProperty(null)}
                      className="text-xs text-[#5C5F58] hover:text-[#1A1D1B] cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#4A4E48] mb-1">Property Name *</label>
                      <input
                        type="text"
                        required
                        value={editingProperty.name || ''}
                        onChange={(e) => setEditingProperty({ ...editingProperty, name: e.target.value })}
                        placeholder="e.g. Rafiki Heights"
                        className="w-full h-10 px-3 rounded-lg bg-white border border-[#1A1D1B]/15 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#4A4E48] mb-1">URL Slug</label>
                      <input
                        type="text"
                        value={editingProperty.slug || ''}
                        onChange={(e) => setEditingProperty({ ...editingProperty, slug: e.target.value })}
                        placeholder="rafiki-heights"
                        className="w-full h-10 px-3 rounded-lg bg-white border border-[#1A1D1B]/15 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#4A4E48] mb-1">Property Type</label>
                      <input
                        type="text"
                        value={editingProperty.property_type || ''}
                        onChange={(e) => setEditingProperty({ ...editingProperty, property_type: e.target.value })}
                        placeholder="Boutique Apartment, Garden Villa..."
                        className="w-full h-10 px-3 rounded-lg bg-white border border-[#1A1D1B]/15 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#4A4E48] mb-1">Neighborhood / Area *</label>
                      <input
                        type="text"
                        required
                        value={editingProperty.location || ''}
                        onChange={(e) => setEditingProperty({ ...editingProperty, location: e.target.value })}
                        placeholder="Kilimani, Westlands, Kileleshwa..."
                        className="w-full h-10 px-3 rounded-lg bg-white border border-[#1A1D1B]/15 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#4A4E48] mb-1">City *</label>
                      <input
                        type="text"
                        required
                        value={editingProperty.city || 'Nairobi'}
                        onChange={(e) => setEditingProperty({ ...editingProperty, city: e.target.value })}
                        className="w-full h-10 px-3 rounded-lg bg-white border border-[#1A1D1B]/15 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#4A4E48] mb-1">Country</label>
                      <input
                        type="text"
                        value={editingProperty.country || 'Kenya'}
                        onChange={(e) => setEditingProperty({ ...editingProperty, country: e.target.value })}
                        className="w-full h-10 px-3 rounded-lg bg-white border border-[#1A1D1B]/15 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#4A4E48] mb-1">Price / Night (KSh) *</label>
                      <input
                        type="number"
                        required
                        min={1000}
                        step={500}
                        value={editingProperty.price_per_night || 8500}
                        onChange={(e) => setEditingProperty({ ...editingProperty, price_per_night: Number(e.target.value) })}
                        className="w-full h-10 px-3 rounded-lg bg-white border border-[#1A1D1B]/15 text-sm font-mono-num"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#4A4E48] mb-1">Max Guests</label>
                      <input
                        type="number"
                        min={1}
                        value={editingProperty.max_guests || 2}
                        onChange={(e) => setEditingProperty({ ...editingProperty, max_guests: Number(e.target.value) })}
                        className="w-full h-10 px-3 rounded-lg bg-white border border-[#1A1D1B]/15 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#4A4E48] mb-1">Bedrooms</label>
                      <input
                        type="number"
                        min={1}
                        value={editingProperty.bedrooms || 1}
                        onChange={(e) => setEditingProperty({ ...editingProperty, bedrooms: Number(e.target.value) })}
                        className="w-full h-10 px-3 rounded-lg bg-white border border-[#1A1D1B]/15 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#4A4E48] mb-1">Beds</label>
                      <input
                        type="number"
                        min={1}
                        value={editingProperty.beds || 1}
                        onChange={(e) => setEditingProperty({ ...editingProperty, beds: Number(e.target.value) })}
                        className="w-full h-10 px-3 rounded-lg bg-white border border-[#1A1D1B]/15 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#4A4E48] mb-1">Bathrooms</label>
                      <input
                        type="number"
                        min={1}
                        step={0.5}
                        value={editingProperty.bathrooms || 1}
                        onChange={(e) => setEditingProperty({ ...editingProperty, bathrooms: Number(e.target.value) })}
                        className="w-full h-10 px-3 rounded-lg bg-white border border-[#1A1D1B]/15 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#4A4E48] mb-1">Check-in</label>
                      <input
                        type="text"
                        value={editingProperty.check_in_time || '2:00 PM'}
                        onChange={(e) => setEditingProperty({ ...editingProperty, check_in_time: e.target.value })}
                        className="w-full h-10 px-3 rounded-lg bg-white border border-[#1A1D1B]/15 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#4A4E48] mb-1">Check-out</label>
                      <input
                        type="text"
                        value={editingProperty.check_out_time || '11:00 AM'}
                        onChange={(e) => setEditingProperty({ ...editingProperty, check_out_time: e.target.value })}
                        className="w-full h-10 px-3 rounded-lg bg-white border border-[#1A1D1B]/15 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#4A4E48] mb-1">Description *</label>
                    <textarea
                      rows={3}
                      required
                      value={editingProperty.description || ''}
                      onChange={(e) => setEditingProperty({ ...editingProperty, description: e.target.value })}
                      className="w-full p-3 rounded-lg bg-white border border-[#1A1D1B]/15 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#4A4E48] mb-1">Neighborhood Overview</label>
                    <textarea
                      rows={2}
                      value={editingProperty.neighborhood_overview || ''}
                      onChange={(e) => setEditingProperty({ ...editingProperty, neighborhood_overview: e.target.value })}
                      className="w-full p-3 rounded-lg bg-white border border-[#1A1D1B]/15 text-sm"
                    />
                  </div>

                  {/* Photo & Gallery Upload Management */}
                  <PropertyPhotosManager
                    images={editingProperty.images || []}
                    propertyId={editingProperty.id}
                    propertyName={editingProperty.name || 'Residence'}
                    onChange={(updatedImages) =>
                      setEditingProperty({ ...editingProperty, images: updatedImages })
                    }
                  />

                  {/* Amenities checkboxes */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-[#1A1D1B]">Amenities</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {AVAILABLE_AMENITIES.map((amenity) => {
                        const checked = (editingProperty.amenities || []).includes(amenity);
                        return (
                          <label key={amenity} className="flex items-center gap-2 text-xs cursor-pointer p-2 rounded bg-white border border-[#1A1D1B]/10">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const current = editingProperty.amenities || [];
                                const next = e.target.checked
                                  ? [...current, amenity]
                                  : current.filter((a) => a !== amenity);
                                setEditingProperty({ ...editingProperty, amenities: next });
                              }}
                              className="accent-[#2C4C3E]"
                            />
                            <span>{amenity}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1A1D1B]/10">
                    <button
                      type="button"
                      onClick={() => setEditingProperty(null)}
                      className="px-4 py-2 rounded-lg border border-[#1A1D1B]/20 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={propertySaving}
                      className="px-5 py-2 rounded-lg bg-[#2C4C3E] text-white text-xs font-semibold cursor-pointer"
                    >
                      {propertySaving ? 'Saving...' : 'Save Property'}
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((prop) => (
                  <div key={prop.id} className="rounded-xl bg-[#FBF9F5] border border-[#1A1D1B]/12 overflow-hidden p-5 space-y-3">
                    <div className="aspect-4/3 rounded-lg overflow-hidden bg-[#F2EFE9]">
                      <ResilientImage
                        src={prop.images?.find((i) => i.is_cover)?.url || prop.images?.[0]?.url || ''}
                        alt={prop.name}
                        fallbackLabel={prop.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-[#5C5F58]">
                      <span>{prop.location}, {prop.city}</span>
                      <span className={prop.published ? 'text-[#16A34A] font-medium' : 'text-[#D97706] font-medium'}>
                        {prop.published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <h3 className="font-serif text-2xl font-semibold text-[#1A1D1B]">{prop.name}</h3>
                    <p className="text-xs text-[#5C5F58]">{prop.bedrooms} bed · {prop.bathrooms} bath · {formatKES(prop.price_per_night)}/night</p>
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#1A1D1B]/8">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingProperty(prop)}
                          className="px-3 py-1.5 rounded bg-[#F2EFE9] text-xs font-semibold text-[#1A1D1B] hover:bg-[#E5DFD3] cursor-pointer inline-flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTogglePropertyPublish(prop)}
                          className="px-3 py-1.5 rounded bg-[#F2EFE9] text-xs text-[#4A4E48] hover:text-[#1A1D1B] cursor-pointer"
                        >
                          {prop.published ? 'Unpublish' : 'Publish'}
                        </button>
                      </div>

                      {deletingPropertyId === prop.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleConfirmDeleteProperty(prop.id)}
                            className="px-2 py-1 rounded bg-[#DC2626] text-white text-xs font-semibold cursor-pointer"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingPropertyId(null)}
                            className="px-2 py-1 rounded bg-white text-xs text-[#4A4E48] cursor-pointer"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeletingPropertyId(prop.id)}
                          aria-label={`Delete ${prop.name}`}
                          className="p-1.5 rounded text-[#DC2626] hover:bg-[#FEF2F2] cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'guests' && (
            <div className="space-y-6">
              <h1 className="font-serif text-3xl font-semibold text-[#1A1D1B]">Guest Directory</h1>
              <div className="rounded-xl bg-[#FBF9F5] border border-[#1A1D1B]/12 overflow-hidden">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#F2EFE9] border-b border-[#1A1D1B]/10 text-xs text-[#5C5F58]">
                      <th className="py-3 px-4">Full Name</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Phone</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A1D1B]/8">
                    {guests.map((g) => (
                      <tr key={g.id}>
                        <td className="py-3.5 px-4 font-medium">{g.full_name}</td>
                        <td className="py-3.5 px-4 text-[#4A4E48]">{g.email}</td>
                        <td className="py-3.5 px-4 font-mono-num">{formatDisplayPhone(g.phone)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <h1 className="font-serif text-3xl font-semibold text-[#1A1D1B]">Guest Reviews</h1>
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div key={r.id} className="p-5 rounded-xl bg-[#FBF9F5] border border-[#1A1D1B]/12 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{r.guest_name} · {r.rating} Stars</p>
                      <p className="text-sm text-[#4A4E48]">{r.comment}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-2xl">
              <h1 className="font-serif text-3xl font-semibold text-[#1A1D1B]">Settings</h1>
              <form onSubmit={handleSaveSettings} className="space-y-4 bg-[#F2EFE9] p-6 rounded-xl border border-[#1A1D1B]/12">
                <div>
                  <label className="block text-xs font-medium mb-1">WhatsApp Number</label>
                  <input
                    type="text"
                    value={settingsForm.whatsapp_number}
                    onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp_number: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg bg-white border border-[#1A1D1B]/15 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={settingsForm.phone_number}
                    onChange={(e) => setSettingsForm({ ...settingsForm, phone_number: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg bg-white border border-[#1A1D1B]/15 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={settingsSaving}
                  className="px-5 py-2.5 rounded-lg bg-[#2C4C3E] text-white text-xs font-semibold cursor-pointer"
                >
                  Save Settings
                </button>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
