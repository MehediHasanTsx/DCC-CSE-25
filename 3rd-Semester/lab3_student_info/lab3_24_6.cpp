#include <iostream>
using namespace std;

class student
{
public:
    int roll;
    float marks;

    void input()
    {
        cout << "Enter roll and marks:" << endl;
        cin >> roll >> marks;
    }

    void show()
    {
        cout << "Student's roll and marks are:" << endl;
        cout << roll << " and " << marks;
    }
};

int main()
{
    student s;

    s.input();
    s.show();

    student std2;

    std2.input();
    std2.show();
}