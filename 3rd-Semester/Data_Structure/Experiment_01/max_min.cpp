#include <iostream>
using namespace std;
int main()
{
  int n;
  cin >> n;

  int a[n];
  for (int k = 0; k < n; k++)
  {
    cin >> a[k];
  }

  int maximum = a[0];
  int minimum = a[0];
  int maximum_position = 0;
  int minimum_position = 0;

  for (int k = 0; k < n; k++)
  {
    if (maximum < a[k])
    {
      maximum = a[k];
      maximum_position = k;
    }
    if (minimum > a[k])
    {
      minimum = a[k];
      minimum_position = k;
    }
  }

  cout << "Maximum element is " << maximum << " at position "
       << maximum_position + 1 << endl;

  cout << "Minimum element is " << minimum << " at position "
       << minimum_position + 1 << endl;

  return 0;
}