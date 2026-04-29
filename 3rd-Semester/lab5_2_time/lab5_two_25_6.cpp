#include <iostream>
using namespace std;
class Time
{
    int hours;
    int minutes;
    int seconds;

public:
    void gettime(int h, int m, int s)
    {
        hours = h;
        minutes = m;
        seconds = s;
    }
    void puttime(void)
    {
        cout << hours << "hours" << minutes << "minutes" << seconds << "seconds" << endl;
    }
    void sum(Time, Time, Time);
};

void Time::sum(Time t1, Time t2, Time t3)
{
    minutes = seconds / 60;
    seconds = seconds % 60;
    minutes = t1.minutes + t2.minutes + t3.minutes;
    hours = minutes / 60;
    minutes = minutes % 60;
    hours = hours + t1.hours + t2.hours + t3.hours;
}
int main()
{
    Time T1, T2, T3, T4;
    T1.gettime(2, 45, 30);
    T2.gettime(3, 40, 40);
    T3.gettime(3, 20, 20);
    T4.sum(T1, T2, T3);
    cout << "T1=";
    T1.puttime();
    cout << "T2=";
    T2.puttime();
    cout << "T3=";
    T3.puttime();
    cout << "T4=";
    T4.puttime();
}