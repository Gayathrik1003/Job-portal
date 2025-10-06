import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getUserFromToken } from "@/lib/auth"
import { sql } from "@/lib/db"
import { Briefcase, ArrowLeft, Bell } from "lucide-react"

async function getNotifications(userId: number) {
  const notifications = await sql`
    SELECT id, title, message, type, is_read, created_at, related_application_id
    FROM notifications
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `
  return notifications
}

export default async function NotificationsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth-token")?.value

  if (!token) {
    redirect("/login")
  }

  const user = await getUserFromToken(token)
  if (!user || user.role !== "job_seeker") {
    redirect("/login")
  }

  const notifications = await getNotifications(user.id)

  // Mark all unread notifications as read when viewing the page
  try {
    await sql`
      UPDATE notifications SET is_read = TRUE WHERE user_id = ${user.id} AND is_read = FALSE
    `
  } catch (_) {}

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return "🎉"
      case "error":
        return "❌"
      case "info":
        return "ℹ️"
      default:
        return "📢"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="flex items-center">
              <Briefcase className="h-8 w-8 text-blue-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">Sarkar Daily Jobs</span>
            </Link>
            <Link href="/seeker/dashboard">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <Bell className="h-8 w-8 mr-3" />
            Notifications
          </h1>
          <p className="text-gray-600">Stay updated on your job applications and opportunities</p>
        </div>

        {notifications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
              <p className="text-gray-600">You'll receive notifications when employers respond to your applications</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card key={notification.id} className={!notification.is_read ? "border-blue-200 bg-blue-50" : ""}>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{notification.title}</h3>
                        <div className="flex items-center space-x-2">
                          {!notification.is_read && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              New
                            </Badge>
                          )}
                          <span className="text-sm text-gray-500">
                            {new Date(notification.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-700 mb-3">{notification.message}</p>
                      {notification.related_application_id && (
                        <Link href="/seeker/applications">
                          <Button variant="outline" size="sm">
                            View Application
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
