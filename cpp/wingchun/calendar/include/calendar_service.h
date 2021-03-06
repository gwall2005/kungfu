//
// Created by PolarAir on 2019-02-28.
//

#ifndef KUNGFU_CALENDAR_SERVICE_H
#define KUNGFU_CALENDAR_SERVICE_H

#include "util/include/business_helper.h"
#include "util/include/env.h"
#include <atomic>
#include <nanomsg/nn.h>
#include <thread>
#include <vector>
#include "msg.h"

namespace kungfu
{
    class CalendarService
    {
    public:
        CalendarService(const std::string& base_dir = get_base_dir());
        virtual ~CalendarService();
        void run();
        void join();
        void stop();

    protected:
        void loop_new_date();
        void loop_reqs();
        int get_current_trading_day() const;
        int calc_next_trading_day(int date, int delta) const;
        void publish_via_nanomsg(int socket, const std::string& date, MsgType msg_type);

    protected:
        int rsp_socket_;
        int pub_socket_;
        std::vector<std::shared_ptr<std::thread>> threads_;
        static std::atomic<bool> started_;
        std::atomic<int> current_;
        std::vector<int> trading_days_;
    private:
        static void signal_handler(int signal);
    };
} // namespace kungfu

#endif // KUNGFU_CALENDAR_SERVICE_H
