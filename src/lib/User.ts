/**
 * Models a user
 *
 * @typedef User
 * @prop {string} email Email address
 * @prop {string} firstName First name
 * @prop {string} IDP Identity provider
 * @prop {string} lastName Last name
 * @prop {string} role User's role
 * @prop {string} userStatus User's status
 * @prop {string} organization User's organization
 * @
 */
class User {
  public _id: string;

  private _email: string;

  private _firstName: string;

  private _IDP: 'nih' | 'login.gov';

  private _lastName: string;

  private _role: 'Admin' | 'User' | 'Curator' | 'FederalLead' | 'DC_POC';

  private _userStatus: 'Active' | 'Inactive' | 'Disabled';

  private _organization: string;

  private _createdAt: string;

  private _updateAt: string;

  constructor(userData) {
    this._id = userData._id ?? '';
    this._email = userData._email ?? userData.email ?? '';
    this._firstName = userData._firstName ?? userData.firstName ?? '';
    this._IDP = userData._IDP ?? userData.IDP ?? '';
    this._lastName = userData._lastName ?? userData.lastName ?? '';
    this._role = userData._role ?? userData.role ?? '';
    this._userStatus = userData._userStatus ?? userData.userStatus ?? '';
    this._organization = userData._organization ?? userData.organization ?? '';
    this._createdAt = userData._createdAt ?? userData.createdAt ?? '';
    this._updateAt = userData._updateAt ?? userData.updateAt ?? '';
  }

  /**
   * @returns {string}
   */
  get email() {
    return this._email;
  }

  /**
   * @returns {string}
   */
  get firstName() {
    return this._firstName;
  }

  /**
   * @returns {string}
   */
  get IDP() {
    return this._IDP;
  }

  /**
   * @returns {string}
   */
  get lastName() {
    return this._lastName;
  }

  /**
   * @returns {string}
   */
  get role() {
    return this._role;
  }

  /**
   * @returns {string}
   */
  get userStatus() {
    return this._userStatus;
  }

  /**
   * @returns {string}
   */
  get organization() {
    return this._organization;
  }

  /** First name if IDP is NIH; otherwise, email address
   *
   * @returns {string}
   */
  get displayName() {
    if (this._IDP === 'nih') {
      return this._firstName;
    }

    return this._email.split('@')[0];
  }

  /**
   * First and last name
   *
   * @returns {string}
   */
  get name() {
    if (this._IDP === 'nih') {
      return `${this._firstName} ${this._lastName}`;
    }

    return this._email.split('@')[0];
  }

  /**
   * Created at date
   *
   * @returns {string}
   */
  get createdAt() {
    return this._createdAt;
  }

  /**
   * Updated at date
   *
   * @returns {string}
   */
  get updateAt() {
    return this._updateAt;
  }
}

export default User;
