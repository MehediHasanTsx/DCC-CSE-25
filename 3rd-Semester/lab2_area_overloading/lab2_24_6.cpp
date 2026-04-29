#include <iostream>
using namespace std;

int area(int);        // square
long area(long, int); // rectangle
double area(double);  // circle

int main()
{
    cout << area(100) << endl;  // square
    cout << area(5.0) << endl;  // circle
    cout << area(3, 8) << endl; // rectangle

    return 0;
}

int area(int s) // square
{
    return (s * s);
}

double area(double r) // circle
{
    return (3.14159 * r * r);
}

long area(long l, int b) // rectangle
{
    return (l * b);
}