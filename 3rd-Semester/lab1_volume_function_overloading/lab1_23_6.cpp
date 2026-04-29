#include <iostream>
using namespace std;

int volume(int);             // qube
double volume(double, int);  // circle
long volume(long, int, int); // cylinder

int main()
{
    cout << volume(100) << endl;        // qube
    cout << volume(3, 8) << endl;       // circle
    cout << volume(10, 70, 10) << endl; // cylinder

    return 0;
}

int volume(int s) // queb volume
{
    return (s * s * s);
}

double volume(double r, int h) // circle volume
{
    return (3.14159 * r * r * h);
}

long volume(long l, int b, int h) // cylinder volume
{
    return (l * b * h);
}